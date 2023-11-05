import { useEffect, useMemo } from 'react';
import {
    compareRequirements,
    Requirement,
    ScoreboardDisplay,
} from '../../database/requirement';

import { useApi } from '../Api';
import { Request, useRequest } from '../Request';
import { useCache } from './Cache';
import { ALL_COHORTS, dojoCohorts } from '../../database/user';

interface UseRequirementsResponse {
    requirements: Requirement[];
    request: Request;
}

export function useRequirements(
    cohort: string,
    scoreboardOnly: boolean
): UseRequirementsResponse {
    const api = useApi();
    const cache = useCache();
    const request = useRequest();

    const requirements = useMemo(() => {
        return cache.requirements
            .filter((r) => {
                if (
                    scoreboardOnly &&
                    (r.scoreboardDisplay === ScoreboardDisplay.Hidden ||
                        r.scoreboardDisplay === ScoreboardDisplay.NonDojo)
                ) {
                    return false;
                }
                if (cohort === ALL_COHORTS) {
                    return true;
                }
                return r.counts[cohort] !== undefined;
            })
            .sort(compareRequirements);
    }, [cache.requirements, cohort, scoreboardOnly]);

    useEffect(() => {
        if (
            (cohort === ALL_COHORTS || dojoCohorts.includes(cohort)) &&
            !cache.requirements.isFetched(ALL_COHORTS) &&
            !cache.requirements.isFetched(cohort) &&
            !request.isSent()
        ) {
            request.onStart();
            api.listRequirements(cohort, false)
                .then((requirements) => {
                    console.log('listRequirements: ', requirements);
                    cache.requirements.markFetched(cohort);
                    cache.requirements.putMany(requirements);
                    request.onSuccess();
                })
                .catch((err) => {
                    console.error('listRequirements: ', err);
                    request.onFailure(err);
                });
        }
    }, [requirements, api, request, cache.requirements, cohort]);

    const reset = request.reset;
    useEffect(() => {
        if (!cache.requirements.isFetched(cohort)) {
            reset();
        }
    }, [cohort, cache.requirements, reset]);

    return { requirements, request };
}

interface UseRequirementResponse {
    requirement?: Requirement;
    request: Request;
}

export function useRequirement(id?: string): UseRequirementResponse {
    const api = useApi();
    const cache = useCache();
    const request = useRequest();

    const requirement = useMemo(() => {
        if (id) {
            return cache.requirements.get(id);
        }
        return undefined;
    }, [cache.requirements, id]);

    useEffect(() => {
        if (requirement === undefined && id && !request.isSent()) {
            console.log('Sending getRequirement network request');
            request.onStart();
            api.getRequirement(id)
                .then((response) => {
                    cache.requirements.put(response.data);
                    request.onSuccess();
                })
                .catch((err) => {
                    console.error(err);
                    request.onFailure(err);
                });
        }
    }, [requirement, request, api, cache.requirements, id]);

    return { requirement, request };
}
