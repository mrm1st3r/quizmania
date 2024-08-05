import {Game, GameQuestion, Player, QuestionStatus} from "../../../domain/GameModel";
import {gameCommandService, GameException} from "../../../services/GameCommandService";
import {Box, Button, CircularProgress, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography} from "@mui/material";
import CheckCircle from "@mui/icons-material/CheckCircle";
import {QuestionContainer} from "../question/QuestionContainer";
import Cookies from "js-cookie";
import PlayArrow from "@mui/icons-material/PlayArrow";
import Cancel from "@mui/icons-material/Cancel";
import React from "react";
import {QuestionMark} from "@mui/icons-material";
import {QuestionPhrasePanel} from "../question/QuestionPhrasePanel";
import {GameQuestionMode} from "../../../services/GameEventTypes";
import {BuzzerQuestionContainer} from "../question/BuzzerQuestionContainer";
import {useSnackbar} from "material-ui-snackbar-provider";
import {CorrectAnswerContainer} from "../question/CorrectAnswerContainer";

export type PlayerGameRoomPanelProps = {
  game: Game,
  player: Player,
  question: GameQuestion,
}


export const PlayerGameRoomPanel = ({game, question, player}: PlayerGameRoomPanelProps) => {
  const snackbar = useSnackbar()

  let container
  if (question === undefined) {
    container = <div>Waiting for first question</div>
  } else if (question.status === QuestionStatus.OPEN) {
    if (question.hasPlayerAlreadyAnswered(player.id)) {
      container = <Stack spacing={2}>
        <QuestionPhrasePanel gameQuestion={question}/>
        <Paper sx={{padding: 2}}>
          <Box sx={{display: 'block', m: 'auto', alignContent: 'center'}}>
            <Typography sx={{flex: '1 1 100%', textAlign: 'center'}} variant="h4" component="div">
              {question.answers.length} of {game.players.length} players answered
            </Typography>
            <Box sx={{display: 'flex', justifyContent: 'center'}}>
              <CircularProgress/>
            </Box>
          </Box>
        </Paper>
      </Stack>
    } else {
      if (question.questionMode === GameQuestionMode.COLLECTIVE) {
        const onAnswerQuestion = async (answer: string) => {
          try {
            await gameCommandService.answerQuestion({
              gameId: game.id,
              gameQuestionId: question.gameQuestionId,
              answer: answer
            })
          } catch (error) {
            if (error instanceof GameException) {
              snackbar.showMessage(error.message)
            }
          }
        }

        container = <QuestionContainer gameQuestion={question} onAnswerQuestion={onAnswerQuestion}/>
      } else if (question.questionMode === GameQuestionMode.BUZZER) {
        const onBuzzQuestion = async () => {
          try {
            await gameCommandService.buzzQuestion({
              gameId: game.id,
              gameQuestionId: question.gameQuestionId,
              buzzerTimestamp: new Date().toISOString()
            })
          } catch (error) {
            if (error instanceof GameException) {
              snackbar.showMessage(error.message)
            }
          }
        }
        container = <BuzzerQuestionContainer gameQuestion={question} player={player} onBuzzQuestion={onBuzzQuestion}/>
      } else {
        container = <div>Unknown gameQuestionMode {question.questionMode}</div>
      }
    }
  } else if (question.status === QuestionStatus.CLOSED || question.status === QuestionStatus.SCORED) {
    let nextButton;
    const onNextQuestion = async () => {
      try {
        await gameCommandService.askNextQuestion(game.id)
      } catch (error) {
        if (error instanceof GameException) {
          snackbar.showMessage(error.message)
        }
      }
    }


    if (question.status === QuestionStatus.SCORED && game.creator === Cookies.get('username')) {
      nextButton = <div style={{display: "flex", alignItems: "center"}}>
        <Button id="nextQuestion" sx={{margin: 'auto'}} startIcon={<PlayArrow/>} variant="contained"
                onClick={onNextQuestion}>Next question</Button>
      </div>
    }
    container =
      <Stack spacing={2}>
        <QuestionPhrasePanel gameQuestion={question}/>
        <CorrectAnswerContainer correctAnswer={question.question.correctAnswer} />
        {nextButton}
        <Table aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell></TableCell>
              <TableCell>Username</TableCell>
              <TableCell>Answer</TableCell>
              <TableCell align="right">Points</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {[...question.answers].sort((a1, a2) => a1.points - a2.points || game.findPlayerName(a1.gamePlayerId).localeCompare(game.findPlayerName(a2.gamePlayerId))).map(answer => {
              let icon;
              if (question.status === QuestionStatus.SCORED) {
                if (answer.points > 0) {
                  icon = <CheckCircle color='success'/>
                } else {
                  icon = <Cancel color='error'/>
                }
              } else {
                icon = <QuestionMark color='info'/>
              }
              return (
                <TableRow key={answer.id} sx={{'&:last-child td, &:last-child th': {border: 0}}}>
                  <TableCell align="left">{icon}</TableCell>
                  <TableCell component="th" scope="row">
                    <Typography variant="body1" component="div">
                      {game.findPlayerName(answer.gamePlayerId)}
                    </Typography>
                  </TableCell>
                  <TableCell component="th" scope="row">
                    <Typography variant="body1" component="div">
                      {answer.answer}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">{answer.points}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Stack>

  } else {
    container = <div>Unknown state</div>
  }

  return <Box sx={{maxWidth: '650px', width: '100%'}}>
    {container}
  </Box>
}
