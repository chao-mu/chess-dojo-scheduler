import { useEffect, useState } from 'react';
import { RequestSnackbar, useRequest } from '../api/Request';
import { Game, GameInfo } from '../database/game';
import { useAuth } from '../auth/Auth';
import { useApi } from '../api/Api';
import { compareCohorts } from '../database/user';
import LoadingPage from '../loading/LoadingPage';
import {
    Box,
    Container,
    FormControl,
    FormControlLabel,
    FormLabel,
    Radio,
    RadioGroup,
    Stack,
    Typography,
} from '@mui/material';
import PgnErrorBoundary from '../games/view/PgnErrorBoundary';
import PgnBoard from '../board/pgn/PgnBoard';
import PgnSelector from './openings/PgnSelector';
import PuzzleBoard from '../board/puzzle/PuzzleBoard';
import { coachUrls, coaches } from '../database/opening';

const GamesToMemorizeTab = () => {
    const user = useAuth().user!;
    const api = useApi();
    const listRequest = useRequest<GameInfo[]>();
    const getRequest = useRequest<Game>();
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [mode, setMode] = useState('study');

    useEffect(() => {
        if (!listRequest.isSent()) {
            listRequest.onStart();

            api.listGamesByOwner('games_to_memorize')
                .then((res) => {
                    console.log('listGamesToMemorize: ', res);
                    const games = res.data.games.sort((lhs, rhs) =>
                        compareCohorts(lhs.cohort, rhs.cohort)
                    );
                    listRequest.onSuccess(games);
                    const i = games.findIndex((g) => g.cohort === user.dojoCohort);
                    if (i >= 0) {
                        setSelectedIndex(i);
                    }
                })
                .catch((err) => {
                    console.error('listGamesToMemorize: ', err);
                    listRequest.onFailure(err);
                });
        }
    }, [listRequest, api, user.dojoCohort]);

    useEffect(() => {
        if (!getRequest.isSent() && (listRequest.data?.length || 0) > 0) {
            const gameInfo = listRequest.data![selectedIndex];

            getRequest.onStart();
            api.getGame(gameInfo.cohort, gameInfo.id)
                .then((res) => {
                    console.log('getGame: ', res);
                    getRequest.onSuccess(res.data);
                })
                .catch((err) => {
                    console.error('getGame: ', err);
                    getRequest.onFailure(err);
                });
        }
    }, [listRequest, getRequest, selectedIndex, api]);

    if (listRequest.isLoading() || !listRequest.isSent()) {
        return <LoadingPage />;
    }

    if (!listRequest.data || listRequest.data.length === 0) {
        return <Typography>No games found</Typography>;
    }

    const onSwitchGame = (idx: number) => {
        if (idx !== selectedIndex) {
            setSelectedIndex(idx);
            getRequest.reset();
        }
    };

    return (
        <Stack>
            <Typography sx={{ mb: 4 }}>
                Games to memorize are also available in this{' '}
                <a
                    href='https://lichess.org/study/u9qJoSlL'
                    target='_blank'
                    rel='noreferrer'
                >
                    Lichess study
                </a>
                .
            </Typography>

            <FormControl>
                <FormLabel>Mode</FormLabel>
                <RadioGroup row value={mode} onChange={(e) => setMode(e.target.value)}>
                    <FormControlLabel value='study' control={<Radio />} label='Study' />
                    <FormControlLabel value='test' control={<Radio />} label='Test' />
                </RadioGroup>
            </FormControl>

            <Container
                maxWidth={false}
                sx={{
                    pt: 1,
                    pb: 4,
                    px: '0 !important',
                    '--gap': '16px',
                    '--site-header-height': '80px',
                    '--site-header-margin': '150px',
                    '--player-header-height': '28px',
                    '--coach-width': '400px',
                    '--tools-height': '40px',
                    '--board-width':
                        'calc(100vw - var(--coach-width) - var(--coach-width) - 60px)',
                    '--board-height':
                        'calc(100vh - var(--site-header-height) - var(--site-header-margin) - var(--tools-height) - 2 * var(--player-header-height))',
                    '--board-size': 'calc(min(var(--board-width), var(--board-height)))',
                }}
            >
                <Box
                    sx={{
                        display: 'grid',
                        rowGap: '16px',
                        gridTemplateRows: {
                            xs: 'minmax(0, 18em) auto',
                            xl: 'calc(var(--board-size) + 2 * var(--player-header-height) + var(--tools-height))',
                        },
                        gridTemplateColumns: {
                            xs: '1fr',
                            md: 'var(--board-size) var(--gap) var(--coach-width) auto',
                            xl: 'var(--coach-width) var(--gap) var(--board-size) var(--gap) var(--coach-width) auto',
                        },
                        gridTemplateAreas: {
                            xs: '"extras" "pgn"',
                            md: '"extras extras extras ." "pgn pgn pgn ."',
                            xl: '"extras . pgn pgn pgn ."',
                        },
                    }}
                >
                    <Stack gridArea='extras' height={1} alignItems='center'>
                        <PgnSelector
                            headers={listRequest.data.map((g) => g.headers)}
                            selectedIndex={selectedIndex}
                            setSelectedIndex={onSwitchGame}
                            fullHeight
                        />
                    </Stack>

                    {getRequest.isLoading() && (
                        <Box sx={{ gridArea: 'pgn' }}>
                            <LoadingPage />
                        </Box>
                    )}

                    {getRequest.data && (
                        <PgnErrorBoundary pgn={getRequest.data.pgn}>
                            {mode === 'study' && (
                                <PgnBoard
                                    key={getRequest.data.pgn}
                                    pgn={getRequest.data.pgn}
                                    startOrientation={getRequest.data.orientation}
                                    sx={{
                                        gridArea: 'pgn',
                                        display: 'grid',
                                        width: 1,
                                        gridTemplateRows: {
                                            xs: 'auto auto auto auto var(--gap) minmax(auto, 400px)',
                                            md: 'var(--player-header-height) var(--board-size) var(--player-header-height) auto',
                                        },
                                        gridTemplateColumns: {
                                            xs: '1fr',
                                            md: 'var(--board-size) var(--gap) var(--coach-width)',
                                        },
                                        gridTemplateAreas: {
                                            xs: `"playerheader"
                                             "board"
                                             "playerfooter"
                                             "boardButtons"
                                             "."
                                             "coach"`,

                                            md: `"playerheader . coach"
                                             "board . coach"
                                             "playerfooter . coach"
                                             "boardButtons . ."`,
                                        },
                                    }}
                                />
                            )}

                            {mode === 'test' && (
                                <PuzzleBoard
                                    key={getRequest.data.pgn}
                                    pgn={getRequest.data.pgn}
                                    hideHeader
                                    playBothSides
                                    sx={{
                                        gridArea: 'pgn',
                                        display: 'grid',
                                        width: 1,
                                        gridTemplateRows: {
                                            xs: 'auto auto auto auto var(--gap) minmax(auto, 400px)',
                                            md: 'var(--player-header-height) var(--board-size) var(--player-header-height) auto',
                                        },
                                        gridTemplateColumns: {
                                            xs: '1fr',
                                            md: 'var(--board-size) var(--gap) var(--coach-width)',
                                        },
                                        gridTemplateAreas: {
                                            xs: `"playerheader"
                                             "board"
                                             "playerfooter"
                                             "boardButtons"
                                             "."
                                             "coach"`,

                                            md: `"playerheader . coach"
                                             "board . coach"
                                             "playerfooter . coach"
                                             "boardButtons . ."`,
                                        },
                                    }}
                                    onComplete={() => null}
                                    coachUrl={
                                        coachUrls[coaches[selectedIndex % coaches.length]]
                                    }
                                />
                            )}
                        </PgnErrorBoundary>
                    )}
                </Box>

                <RequestSnackbar request={listRequest} />
                <RequestSnackbar request={getRequest} />
            </Container>
        </Stack>
    );
};

export default GamesToMemorizeTab;