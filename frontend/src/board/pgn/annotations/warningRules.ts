import { Chess, Move } from '@jackstenglein/chess';
import { badMoveNags, getNagInSet, goodMoveNags } from '../Nag';

export interface WarningRule {
    displayName: string;
    description: string;
    predicate: (chess: Chess, move: Move | null) => boolean;
}

export interface Warning {
    displayName: string;
    description: string;
    moves: Array<Move | null>;
}

const ChesscomCommentAfterRegex =
    /(BLUNDER|INACCURACY|MISSED MATE) \((((\+|-)\d+\.?\d*)|(♔ Mate in \d))\)/;
const ChesscomCommentMoveRegex =
    /(\((\+|-)\d+\.?\d*\) The best move was)|(\(♔ Mate in \d\) Checkmate after)/;

const LichessCommentAfterRegex = /(Mistake|Inaccuracy|Blunder)\. .* was best\./;

const rules: WarningRule[] = [
    {
        displayName: 'Missing Game Comment',
        description:
            'Consider adding a game comment before the first move as an introduction to the game or as a summary of the overall narrative of the game.',
        predicate: (chess, move) => {
            return (
                move === null &&
                (chess.pgn.gameComment.trim() === '[#]' || chess.pgn.gameComment === '')
            );
        },
    },
    {
        displayName: 'Poor Move Missing Improvement',
        description:
            "You marked a move as dubious, a mistake or a blunder, but didn't include a comment or variation. Consider adding a comment or variation to describe why the move is bad and what should have been played instead.",
        predicate: (_, move) => {
            return (
                !!move &&
                !!getNagInSet(badMoveNags, move.nags) &&
                !move.commentMove &&
                !move.commentAfter &&
                move.variations.length === 0
            );
        },
    },
    {
        displayName: 'Good Move Missing Explanation',
        description:
            "You marked a move as interesting, good or brilliant, but didn't include a comment or variation explaining why. Consider adding one to make your annotations clearer.",
        predicate: (_, move) => {
            return (
                !!move &&
                !!getNagInSet(goodMoveNags, move.nags) &&
                !move.commentMove &&
                !move.commentAfter &&
                move.variations.length === 0
            );
        },
    },
    {
        displayName: 'Chess.com Computer Analysis',
        description:
            "Your PGN appears to contain automated Chess.com computer analysis. Avoid using the computer until after you've completed your own analysis, or don't use it at all.",
        predicate: (_, move) => {
            return (
                !!move &&
                (ChesscomCommentAfterRegex.test(move.commentAfter || '') ||
                    ChesscomCommentMoveRegex.test(move.commentMove || ''))
            );
        },
    },
    {
        displayName: 'Lichess Computer Analysis',
        description:
            "Your PGN appears to contain automated Lichess computer analysis. Avoid using the computer until after you've completed your own analysis, or don't use it at all.",
        predicate: (_, move) => {
            return !!move && LichessCommentAfterRegex.test(move.commentAfter || '');
        },
    },
];

export function getWarnings(chess: Chess | undefined): Record<string, Warning> {
    if (!chess) {
        return {};
    }
    return getWarningsRecursive(chess, null);
}

function getWarningsRecursive(chess: Chess, move: Move | null): Record<string, Warning> {
    const result: Record<string, Warning> = {};

    for (const rule of rules) {
        if (rule.predicate(chess, move)) {
            if (result[rule.displayName]) {
                result[rule.displayName].moves.push(move);
            } else {
                result[rule.displayName] = {
                    displayName: rule.displayName,
                    description: rule.description,
                    moves: [move],
                };
            }
        }
    }

    for (const variation of move?.variations || []) {
        const recursiveResults = getWarningsRecursive(chess, variation[0]);
        for (const [displayName, warning] of Object.entries(recursiveResults)) {
            if (result[displayName]) {
                result[displayName].moves.push(...warning.moves);
            } else {
                result[displayName] = warning;
            }
        }
    }

    if (chess.nextMove(move)) {
        const recursiveResults = getWarningsRecursive(chess, chess.nextMove(move));
        for (const [displayName, warning] of Object.entries(recursiveResults)) {
            if (result[displayName]) {
                result[displayName].moves.push(...warning.moves);
            } else {
                result[displayName] = warning;
            }
        }
    }

    return result;
}