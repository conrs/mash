import { Either, Left, Right } from "../util/either";

/**
 * Shell history: up walks back, down walks forward, and stepping past the newest line
 * gives an empty line (a fresh prompt), like bash.
 */
export class HistoryTracker {
    private history: string[] = []
    private index: number = 0

    moveUp(): Either<NoHistoryError, string> {
      if(this.index > 0) {
        return Right(this.history[--this.index])
      } else {
        return Left(new NoHistoryError())
      }
    }

    moveDown(): Either<NoHistoryError, string> {
        if(this.index < this.history.length - 1) {
            return Right(this.history[++this.index])
        } else if(this.index == this.history.length - 1) {
            this.index++;
            return Right("")
        }
        return Left(new NoHistoryError())
    }

    addLine(line: string) {
        if(this.history[this.history.length - 1] !== line) {
            this.history.push(line)
        }
        this.index = this.history.length
    }
}

export class NoHistoryError extends Error {}
