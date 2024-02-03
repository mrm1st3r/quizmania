package org.quizmania.rest.application.usecase

import org.quizmania.game.common.*
import org.quizmania.rest.application.domain.GameEntity
import org.quizmania.rest.port.`in`.GameEventHappenedInPort
import org.quizmania.rest.port.out.GameChangedEventEmitterPort
import org.quizmania.rest.port.out.GameRepository
import org.springframework.stereotype.Component

@Component
class GameEventHappenedUseCase(
  val gameRepository: GameRepository,
  val gameChangedEventEmitterPort: GameChangedEventEmitterPort
) : GameEventHappenedInPort {

  private fun updateAndPropagate(evt: GameEvent, transform: (GameEntity) -> (Unit)) {
    gameRepository.findById(evt.gameId)?.let { game ->
      transform.invoke(game)
      gameRepository.save(game)
      gameChangedEventEmitterPort.emitGameChangeEventToPlayers(evt, game)
    }
  }

  override fun gameCreated(evt: GameCreatedEvent) {
    val game = GameEntity(evt)
    gameRepository.save(game)
    gameChangedEventEmitterPort.emitGameChangeEventToPlayers(evt, game)
  }

  override fun gameStarted(evt: GameStartedEvent) = updateAndPropagate(evt) { it.on(evt) }

  override fun gameEnded(evt: GameEndedEvent) = updateAndPropagate(evt) { it.on(evt) }

  override fun gameCanceled(evt: GameCanceledEvent) = updateAndPropagate(evt) { it.on(evt) }

  override fun userAdded(evt: UserAddedEvent) = updateAndPropagate(evt) { it.on(evt) }

  override fun userRemoved(evt: UserRemovedEvent) = updateAndPropagate(evt) { it.on(evt) }

  override fun questionAsked(evt: QuestionAskedEvent) = updateAndPropagate(evt) { it.on(evt) }

  override fun questionAnswered(evt: QuestionAnsweredEvent) = updateAndPropagate(evt) { it.on(evt) }

  override fun questionClosed(evt: QuestionClosedEvent) = updateAndPropagate(evt) { it.on(evt) }
}