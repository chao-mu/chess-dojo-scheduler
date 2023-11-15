import { useEffect, useMemo } from 'react';
import { Box, Button, Container, Divider, Grid, Stack, Typography } from '@mui/material';
import { useParams, useSearchParams } from 'react-router-dom';

import { useApi } from '../../api/Api';
import { RequestSnackbar, useRequest } from '../../api/Request';
import { CourseType } from '../../database/course';
import LoadingPage from '../../loading/LoadingPage';
import Module from './Module';
import NotFoundPage from '../../NotFoundPage';
import Contents from './Contents';
import { GetCourseResponse } from '../../api/courseApi';
import PurchaseCoursePage from './PurchaseCoursePage';

type CoursePageParams = {
    type: CourseType;
    id: string;
};

const CoursePage = () => {
    const api = useApi();
    const params = useParams<CoursePageParams>();
    const request = useRequest<GetCourseResponse>();
    const [searchParams, setSearchParams] = useSearchParams({
        chapter: '0',
        module: '0',
    });

    useEffect(() => {
        if (!request.isSent() && params.type && params.id) {
            request.onStart();
            api.getCourse(params.type, params.id)
                .then((resp) => {
                    request.onSuccess(resp.data);
                    console.log('getCourse: ', resp);
                })
                .catch((err) => {
                    request.onFailure(err);
                    console.error('getCourse: ', err);
                });
        }
    }, [request, api, params]);

    const { course, isBlocked } = request.data || {};
    const chapter = useMemo(() => {
        return course?.chapters
            ? course.chapters[parseInt(searchParams.get('chapter') || '0')]
            : undefined;
    }, [course, searchParams]);

    const moduleIndex = parseInt(searchParams.get('module') || '0');
    const module = useMemo(() => {
        if (moduleIndex >= 0 && moduleIndex < (chapter?.modules.length || 0)) {
            return chapter?.modules[moduleIndex];
        }
    }, [chapter, moduleIndex]);

    if (isBlocked) {
        return <PurchaseCoursePage course={course} />;
    }

    if (!request.isSent() || request.isLoading()) {
        return <LoadingPage />;
    }

    if (course === undefined || chapter === undefined || module === undefined) {
        return <NotFoundPage />;
    }

    return (
        <Container maxWidth={false} sx={{ pt: 6, pb: 4 }}>
            <Grid container rowGap={2}>
                <Grid item xs={12} sm={12} md={9.5}>
                    <Stack>
                        <Typography variant='h4'>{course.name}</Typography>
                        <Typography variant='h5' color='text.secondary'>
                            {course.cohortRange}
                        </Typography>
                        <Divider />

                        <Box mt={2}>
                            <Module module={module} />
                        </Box>
                    </Stack>
                </Grid>

                <Grid item xs={12} sm={12} md={2.5}>
                    <Contents course={course} />
                </Grid>

                <Grid item xs={12} sm={12}>
                    <Stack direction='row' justifyContent='space-between' mt={4}>
                        {moduleIndex > 0 && moduleIndex < chapter.modules.length && (
                            <Button
                                variant='contained'
                                onClick={() =>
                                    setSearchParams({
                                        module: `${moduleIndex - 1}`,
                                    })
                                }
                            >
                                Previous: {chapter.modules[moduleIndex - 1].name}
                            </Button>
                        )}

                        {moduleIndex >= 0 && moduleIndex + 1 < chapter.modules.length && (
                            <Button
                                variant='contained'
                                onClick={() =>
                                    setSearchParams({
                                        module: `${moduleIndex + 1}`,
                                    })
                                }
                            >
                                Next: {chapter.modules[moduleIndex + 1].name}
                            </Button>
                        )}
                    </Stack>
                </Grid>
            </Grid>
            <RequestSnackbar request={request} />
        </Container>
    );
};

export default CoursePage;
