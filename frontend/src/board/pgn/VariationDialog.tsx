import { Move } from '@jackstenglein/chess';
import {
    Dialog,
    DialogContent,
    DialogContentText,
    DialogTitle,
    List,
    ListItemButton,
    ListItemText,
    Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { reconcile } from '../Board';
import { compareNags, getStandardNag, nags } from './Nag';
import { BlockBoardKeyboardShortcuts, useChess } from './PgnBoard';
import { getTextColor } from './pgnText/MoveButton';

interface VariationDialogProps {
    move: Move;
    setMove: (move: Move | null) => void;
}

const VariationDialog: React.FC<VariationDialogProps> = ({ move, setMove }) => {
    const [selected, setSelected] = useState(0);
    const { chess, board } = useChess();

    const selectMove = useCallback(
        (move: Move) => {
            chess?.seek(move);
            reconcile(chess, board);
            setMove(null);
        },
        [chess, board, setMove],
    );

    useEffect(() => {
        if (document.activeElement) {
            (document.activeElement as HTMLElement).blur();
        }
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'ArrowUp') {
                setSelected((s) => {
                    if (s > 0) {
                        return s - 1;
                    }
                    return move.variations.length || 0;
                });
            } else if (event.key === 'ArrowDown') {
                setSelected((s) => {
                    if (s < (move.variations.length || 0)) {
                        return s + 1;
                    }
                    return 0;
                });
            } else if (event.key === 'ArrowRight' || event.key === 'Enter') {
                selectMove(selected === 0 ? move : move.variations[selected - 1][0]);
            } else if (event.key === 'ArrowLeft' || event.key === 'Escape') {
                setMove(null);
            } else if (event.key >= '0' && event.key <= '9') {
                let index = parseInt(event.key);
                if (index === 0 && move.variations.length > 8) {
                    // 0 is out of order to match its position on the keyboard
                    selectMove(move.variations[8][0]);
                } else if (index === 1) {
                    selectMove(move);
                } else if (index - 2 >= 0 && index - 2 < move.variations.length) {
                    selectMove(move.variations[index - 2][0]);
                }
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [move, selected, setMove, selectMove]);

    if (!move.variations || move.variations.length === 0) {
        return null;
    }

    return (
        <Dialog
            open
            onClose={() => setMove(null)}
            classes={{
                container: BlockBoardKeyboardShortcuts,
            }}
            fullWidth
        >
            <DialogTitle>Choose Variation</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Use arrow keys/enter, numbers or click to select a move. Use left
                    arrow or escape to cancel.
                </DialogContentText>
                <List>
                    <ListItemButton
                        selected={selected === 0}
                        onClick={() => selectMove(move)}
                    >
                        <ListItemText sx={{ color: getTextColor(move) }}>
                            {move.san}
                            {move.nags
                                ?.sort(compareNags)
                                .map((n) => nags[getStandardNag(n)]?.label || '')
                                .join('')}
                        </ListItemText>
                        <Typography variant='body2'>1</Typography>
                    </ListItemButton>

                    {move.variations.map((variation, i) => {
                        if (!variation || !variation[0]) {
                            return null;
                        }

                        return (
                            <ListItemButton
                                key={variation[0].san}
                                selected={selected === i + 1}
                                onClick={() => selectMove(variation[0])}
                            >
                                <ListItemText sx={{ color: getTextColor(variation[0]) }}>
                                    {variation[0].san}
                                    {variation[0].nags
                                        ?.sort(compareNags)
                                        .map((n) => nags[getStandardNag(n)]?.label || '')
                                        .join('')}
                                </ListItemText>
                                {i < 9 && (
                                    <Typography variant='body2'>
                                        {(i + 2) % 10}
                                    </Typography>
                                )}
                            </ListItemButton>
                        );
                    })}
                </List>
            </DialogContent>
        </Dialog>
    );
};

export default VariationDialog;
