import { Event, EventType, Move, Pgn, TAGS } from '@jackstenglein/chess';
import { Divider, Paper, Stack, Tooltip, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import { useLightMode } from '../../ThemeProvider';
import {
    CapturedMaterialBehavior,
    CapturedMaterialBehaviorKey,
} from './boardTools/underboard/settings/ViewerSettings';
import { useChess } from './PgnBoard';
import PieceIcon from './pieceIcons/PieceIcon';

interface PlayerHeaderProps {
    type: 'header' | 'footer';
}

export function getInitialClock(pgn?: Pgn): string | undefined {
    if (!pgn) {
        return undefined;
    }

    const timeControl = pgn.header.tags[TAGS.TimeControl];
    if (!timeControl) {
        return undefined;
    }

    const descriptor = timeControl.split(':')[0];
    const time = descriptor.split('/').slice(-1)[0];
    const startTime = parseInt(time?.split('+')[0]);
    if (isNaN(startTime) || startTime <= 0) {
        return undefined;
    }

    let result = '';
    const hours = Math.floor(startTime / 3600);
    if (hours > 0) {
        result = `${hours}:`;
    }

    const minutes = Math.floor((startTime % 3600) / 60);
    result += `${minutes.toLocaleString(undefined, { minimumIntegerDigits: 2 })}:`;

    const seconds = (startTime % 3600) % 60;
    result += `${seconds.toLocaleString(undefined, { minimumIntegerDigits: 2 })}`;

    return result;
}

export const ClockTypeDescriptions: Record<string, string> = {
    emt: 'Elapsed Move Time. The time spent to play the current move. h:mm:ss',
    clk: 'h:mm:ss. The time displayed on the clock after the current move was played.',
};

function getMoveClockText(
    clockCommand: 'emt' | 'clk',
    pgn?: Pgn,
    move?: Move | null,
): string | undefined {
    let currentMove: Move | null | undefined = move;
    while (currentMove) {
        if (currentMove.commentDiag?.[clockCommand]) {
            return currentMove.commentDiag[clockCommand];
        }
        currentMove = currentMove.previous?.previous;
    }

    return getInitialClock(pgn);
}

function getCapturedPieceCounts(fen: string) {
    const pieces = fen.split(' ')[0];
    const capturedPieces: Record<string, number> = {
        p: 8,
        n: 2,
        b: 2,
        r: 2,
        q: 1,
        P: 8,
        N: 2,
        B: 2,
        R: 2,
        Q: 1,
    };
    for (const piece of pieces) {
        if (capturedPieces[piece]) {
            capturedPieces[piece] -= 1;
        }
    }
    return capturedPieces;
}

const rerenderHeaders = [
    TAGS.White,
    TAGS.WhiteElo,
    TAGS.Black,
    TAGS.BlackElo,
    TAGS.Result,
    TAGS.TimeControl,
];

const PlayerHeader: React.FC<PlayerHeaderProps> = ({ type }) => {
    const { chess, board } = useChess();
    const [, setForceRender] = useState(0);
    const light = useLightMode();

    useEffect(() => {
        if (chess) {
            const observer = {
                types: [
                    EventType.LegalMove,
                    EventType.NewVariation,
                    EventType.UpdateCommand,
                    EventType.UpdateHeader,
                ],
                handler: (event: Event) => {
                    if (
                        event.type === EventType.UpdateCommand &&
                        event.commandName !== 'clk' &&
                        event.commandName !== 'emt'
                    ) {
                        return;
                    }
                    if (
                        event.type === EventType.UpdateHeader &&
                        !rerenderHeaders.includes(event.headerName || '')
                    ) {
                        return;
                    }
                    setForceRender((v) => v + 1);
                },
            };

            chess.addObserver(observer);
            return () => chess.removeObserver(observer);
        }
    }, [chess, setForceRender]);

    const pgn = chess?.pgn;
    if (!pgn || !board) {
        return null;
    }

    const currentMove = chess?.currentMove();

    let playerName = '';
    let playerElo = '';
    let playerResult = '';
    let move: Move | null | undefined = currentMove;
    let clockCommand: 'emt' | 'clk' = move?.commentDiag?.emt ? 'emt' : 'clk';
    let color: 'w' | 'b' = 'w';

    if (
        (type === 'header' && board.state.orientation === 'white') ||
        (type === 'footer' && board.state.orientation === 'black')
    ) {
        playerName = pgn.header.tags.Black;
        playerElo = pgn.header.tags.BlackElo;
        const resultTokens = pgn.header.tags.Result?.split('-');
        if (resultTokens && resultTokens.length > 1) {
            playerResult = resultTokens[1];
        }
        if (currentMove?.color !== 'b') {
            move = currentMove?.previous || null;
        }
        color = 'b';
    } else {
        playerName = pgn.header.tags.White;
        playerElo = pgn.header.tags.WhiteElo;
        const resultTokens = pgn.header.tags.Result?.split('-');
        if (resultTokens && resultTokens.length > 1) {
            playerResult = resultTokens[0];
        }
        if (currentMove?.color !== 'w') {
            move = currentMove?.previous || null;
        }
    }

    return (
        <Paper
            data-cy={`player-header-${type}`}
            elevation={3}
            variant={light ? 'outlined' : 'elevation'}
            sx={{
                gridArea: `player${type}`,
                boxShadow: 'none',
                height: 'fit-content',
                py: '3px',
                px: '6px',
            }}
        >
            <Stack direction='row' spacing={1} justifyContent='space-between'>
                <Stack direction='row' spacing={1}>
                    {playerResult && (
                        <>
                            <Typography
                                variant='subtitle2'
                                color='text.secondary'
                                fontWeight='bold'
                            >
                                {playerResult}
                            </Typography>
                            <Divider flexItem orientation='vertical' />
                        </>
                    )}

                    <Typography
                        variant='subtitle2'
                        color='text.secondary'
                        fontWeight='bold'
                    >
                        {playerName}
                    </Typography>

                    {playerElo && (
                        <Typography variant='subtitle2' color='text.secondary'>
                            ({playerElo})
                        </Typography>
                    )}

                    <CapturedMaterial move={currentMove} color={color} />
                </Stack>

                <Tooltip title={ClockTypeDescriptions[clockCommand]}>
                    <Typography
                        variant='subtitle2'
                        color='text.secondary'
                        display='inline'
                    >
                        {getMoveClockText(clockCommand, pgn, move)}
                    </Typography>
                </Tooltip>
            </Stack>
        </Paper>
    );
};

const CapturedMaterial: React.FC<{ move: Move | null; color: 'w' | 'b' }> = ({
    move,
    color,
}) => {
    const [capturedMaterialBehavior] = useLocalStorage(
        CapturedMaterialBehaviorKey,
        CapturedMaterialBehavior.Difference,
    );

    if (!move || capturedMaterialBehavior === CapturedMaterialBehavior.None) {
        return null;
    }

    let materialDifference = move.materialDifference;
    let displayedMaterialDiff = '';
    if (color === 'w' && materialDifference > 0) {
        displayedMaterialDiff = `+${materialDifference}`;
    } else if (color === 'b' && materialDifference < 0) {
        displayedMaterialDiff = `+${Math.abs(materialDifference)}`;
    }

    const pieceTypes =
        color === 'w' ? ['p', 'n', 'b', 'r', 'q'] : ['P', 'N', 'B', 'R', 'Q'];
    const capturedPieces = getCapturedPieceCounts(move.after);

    if (capturedMaterialBehavior === CapturedMaterialBehavior.Difference) {
        const opposingPieceTypes =
            color === 'w' ? ['P', 'N', 'B', 'R', 'Q'] : ['p', 'n', 'b', 'r', 'q'];
        for (let i = 0; i < pieceTypes.length; i++) {
            capturedPieces[pieceTypes[i]] = Math.max(
                0,
                capturedPieces[pieceTypes[i]] - capturedPieces[opposingPieceTypes[i]],
            );
        }
    }

    return (
        <Stack direction='row' alignItems='center'>
            {pieceTypes.map((type) => (
                <React.Fragment key={type}>
                    {Array.from(Array(capturedPieces[type])).map((_, i) => (
                        <PieceIcon key={i} piece={type} />
                    ))}
                </React.Fragment>
            ))}
            {displayedMaterialDiff && (
                <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ mt: '2px', ml: '2px' }}
                >
                    {displayedMaterialDiff}
                </Typography>
            )}
        </Stack>
    );
};

export default PlayerHeader;
