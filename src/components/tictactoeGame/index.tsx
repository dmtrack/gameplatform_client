import React, { useContext, useEffect, useState } from 'react';
import styled from 'styled-components';
import gameContext from '../../context/gameContext';
import gameService from '../../services/gameService';
import socketService from '../../services/socketService';
import checkGameState from '../../utils/checkGameState';
import updateGameMatrix from '../../utils/updateGameMatrix';

const GameContainer = styled.div`
    display: flex;
    flex-direction: column;
    position: relative;
`;

const RowContainer = styled.div`
    width: 100%;
    display: flex;
`;

interface ICellProps {
    borderTop?: boolean;
    borderRight?: boolean;
    borderLeft?: boolean;
    borderBottom?: boolean;
}

const Cell = styled.div<ICellProps>`
    width: 9em;
    height: 9em;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 15px;
    cursor: pointer;
    border-top: ${({ borderTop }) => borderTop && '3px solid #fff'};
    border-left: ${({ borderLeft }) => borderLeft && '3px solid #fff'};
    border-bottom: ${({ borderBottom }) => borderBottom && '3px solid #fff'};
    border-right: ${({ borderRight }) => borderRight && '3px solid #fff'};
    transition: all 270ms ease-in-out;
    &:hover {
        background-color: #8d44ad28;
    }
`;

const PlayStopper = styled.div`
    width: 100%;
    height: 100%;
    position: absolute;
    bottom: 0;
    left: 0;
    z-index: 99;
    cursor: default;
`;

const X = styled.span`
    font-size: 100px;
    color: #8e44ad;
    &::after {
        content: 'X';
    }
`;

const O = styled.span`
    font-size: 100px;
    color: #8e44ad;
    &::after {
        content: 'O';
    }
`;

export type IPlayMatrix = Array<Array<string | null>>;

export interface IStartGame {
    start: boolean;
    symbol: 'x' | 'o';
    message?: string;
}

export function TicTacToe() {
    const [matrix, setMatrix] = useState<IPlayMatrix>([
        [null, null, null],
        [null, null, null],
        [null, null, null],
    ]);

    const {
        playerSymbol,
        setPlayerSymbol,
        isPlayerTurn,
        setPlayerTurn,
        isGameStarted,
        setGameStarted,
    } = useContext(gameContext);

    const handleGameUpdate = () => {
        if (socketService.socket)
            gameService.onGameUpdate(socketService.socket, (newMatrix) => {
                if (!isGameStarted) setGameStarted(true);

                setMatrix(newMatrix);
                checkGameState(newMatrix, playerSymbol);
                setPlayerTurn(true);
            });
    };

    const handleGameStart = () => {
        if (socketService.socket)
            gameService.onStartGame(socketService.socket, (options) => {
                setPlayerSymbol(options.symbol);
                setGameStarted(true);
                if (options.start) setPlayerTurn(true);
                else setPlayerTurn(false);
            });
    };

    const handleGameWin = () => {
        if (socketService.socket)
            gameService.onGameWin(socketService.socket, (message) => {
                // console.log('Here', message);
                setPlayerTurn(false);
                alert(message);
            });
    };

    useEffect(() => {
        handleGameUpdate();
        handleGameStart();
        handleGameWin();
    }, []);

    return (
        <GameContainer>
            {!isGameStarted && (
                <h2>Waiting for Other Player to Join to Start the Game!</h2>
            )}
            {(!isGameStarted || !isPlayerTurn) && <PlayStopper />}
            {matrix.map((row, rowIdx) => {
                return (
                    <RowContainer key={rowIdx}>
                        {row.map((column, columnIdx) => (
                            <Cell
                                borderRight={columnIdx < 2}
                                borderLeft={columnIdx > 0}
                                borderBottom={rowIdx < 2}
                                borderTop={rowIdx > 0}
                                onClick={() =>
                                    updateGameMatrix(
                                        setPlayerTurn,
                                        playerSymbol,
                                        matrix,
                                        setMatrix,
                                        columnIdx,
                                        rowIdx,
                                        playerSymbol
                                    )
                                }
                                key={`${rowIdx}${columnIdx}`}>
                                {column && column !== 'null' ? (
                                    column === 'x' ? (
                                        <X />
                                    ) : (
                                        <O />
                                    )
                                ) : null}
                            </Cell>
                        ))}
                    </RowContainer>
                );
            })}
        </GameContainer>
    );
}
