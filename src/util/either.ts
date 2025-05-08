/**
 * The purpose of Either is to encode a happy path and a sad path for a given result. 
 * Left is the container of the sad path result, Right is the container of the happy path result. 
 * 
 * This is preferable to thrown exceptions as it includes the error information in the type signature, 
 * and enables static analysis which can assist the invoker in handling all known error cases rather than
 * letting them become bugs. 
 */

export type Left<T> = {
    left: T;
    right?: never;
};

export type Right<U> = {
    left?: never;
    right?: U;
};

export type Either<T, U> = Left<T> | Right<U>;

export const Left = <T>(x:T): Left<T> => {
    return {
        left: x
    }
}

export const Right = <T>(x?:T): Right<T> => {
    return {
        right: x
    }
}

export const Either =  {
    isLeft: <T, U>(x: Either<T, U>): x is Left<T> => {
        return typeof x.left !== 'undefined'
    },
    isRight: <T, U>(x: Either<T, U>): x is Right<U> => {
        return typeof x.right !== 'undefined'
    },
    getValue: <T, U>(x: Either<T, U>)  => {
        if(Either.isLeft(x)) {
            return x.left as NonNullable<T>
        } else {
            return x.right as NonNullable<U>
        }
    }
}
