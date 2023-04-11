import { Link } from 'react-router-dom';
import {
    GridColDef,
    GridRenderCellParams,
    GridValueFormatterParams,
    GridValueGetterParams,
} from '@mui/x-data-grid';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { IconButton } from '@mui/material';

import ScoreboardProgress from './ScoreboardProgress';
import {
    getCurrentCount,
    getCurrentScore,
    getTotalScore,
    Requirement,
    ScoreboardDisplay,
} from '../database/requirement';
import ScoreboardCheck from './ScoreboardCheck';
import {
    RatingSystem,
    formatRatingSystem as formatRatingSystemEnum,
    User,
} from '../database/user';
import { Graduation, isGraduation } from '../database/graduation';

export type ScoreboardRow = User | Graduation;

export function getColumnDefinition(
    requirement: Requirement,
    cohort: string
): GridColDef<ScoreboardRow> {
    const totalCount = requirement.counts[cohort] || 0;

    const valueGetter = (params: GridValueGetterParams<any, ScoreboardRow>) => {
        return getCurrentCount(cohort, requirement, params.row.progress[requirement.id]);
    };

    const renderCell = (params: GridRenderCellParams<number, ScoreboardRow>) => {
        const score = getCurrentCount(
            cohort,
            requirement,
            params.row.progress[requirement.id]
        );
        switch (requirement.scoreboardDisplay) {
            case ScoreboardDisplay.Checkbox:
                return <ScoreboardCheck value={score} total={totalCount} />;

            case ScoreboardDisplay.Unspecified:
            case ScoreboardDisplay.ProgressBar:
            default:
                return (
                    <ScoreboardProgress
                        value={score}
                        max={totalCount}
                        min={requirement.startCount}
                    />
                );
        }
    };

    let headerName = requirement.name;
    if (requirement.scoreboardDisplay === ScoreboardDisplay.Checkbox && totalCount > 1) {
        headerName += ` (${totalCount})`;
    }

    return {
        field: requirement.id,
        headerName: headerName,
        renderHeader: () => (
            <>
                {headerName}
                <Link to={`/requirements/${requirement.id}`}>
                    <IconButton aria-label={`Info ${requirement.name}`}>
                        <InfoOutlinedIcon
                            sx={{ color: 'text.secondary' }}
                            fontSize='small'
                        />
                    </IconButton>
                </Link>
            </>
        ),
        minWidth: 250,
        valueGetter,
        renderCell,
    };
}

export function getCohortScore(
    params: GridValueGetterParams<any, ScoreboardRow>,
    cohort: string | undefined,
    requirements: Requirement[]
): number {
    if (!cohort) {
        return 0;
    }

    const user = params.row;
    let score = 0;
    for (const requirement of requirements) {
        score += getCurrentScore(cohort, requirement, user.progress[requirement.id]);
    }
    return Math.round(score * 100) / 100;
}

export function getCategoryScore(
    params: GridValueGetterParams<any, ScoreboardRow>,
    cohort: string | undefined,
    category: string,
    requirements: Requirement[]
): number {
    if (!cohort) {
        return 0;
    }

    const user = params.row;
    let score = 0;
    for (const requirement of requirements) {
        if (requirement.category === category) {
            score += getCurrentScore(cohort, requirement, user.progress[requirement.id]);
        }
    }
    return Math.round(score * 100) / 100;
}

export function getPercentComplete(
    params: GridValueGetterParams<any, ScoreboardRow>,
    cohort: string | undefined,
    requirements: Requirement[]
): number {
    if (!cohort) {
        return 0;
    }

    const totalScore = getTotalScore(cohort, requirements);
    const userScore = getCohortScore(params, cohort, requirements);
    return (userScore / totalScore) * 100;
}

export function formatPercentComplete(value: number) {
    return `${Math.round(value)}%`;
}

export function formatRatingSystem(params: GridValueFormatterParams<RatingSystem>) {
    return formatRatingSystemEnum(params.value);
}

export function getStartRating(
    params: GridValueGetterParams<any, ScoreboardRow>
): number {
    if (isGraduation(params.row)) {
        return params.row.startRating;
    }

    const ratingSystem = params.row.ratingSystem;
    switch (ratingSystem) {
        case RatingSystem.Chesscom:
            return params.row.startChesscomRating;
        case RatingSystem.Lichess:
            return params.row.startLichessRating;
        case RatingSystem.Fide:
            return params.row.startFideRating;
        case RatingSystem.Uscf:
            return params.row.startUscfRating;

        default:
            return 0;
    }
}

export function getCurrentRating(
    params: GridValueGetterParams<any, ScoreboardRow>
): number {
    if (isGraduation(params.row)) {
        return params.row.currentRating;
    }

    const ratingSystem = params.row.ratingSystem;
    switch (ratingSystem) {
        case RatingSystem.Chesscom:
            return params.row.currentChesscomRating;
        case RatingSystem.Lichess:
            return params.row.currentLichessRating;
        case RatingSystem.Fide:
            return params.row.currentFideRating;
        case RatingSystem.Uscf:
            return params.row.currentUscfRating;

        default:
            return 0;
    }
}

export function getRatingChange(params: GridValueGetterParams<any, ScoreboardRow>) {
    const startRating = getStartRating(params);
    const currentRating = getCurrentRating(params);
    return currentRating - startRating;
}
