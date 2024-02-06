import axios, { AxiosResponse } from 'axios';

import { getConfig } from '../config';
import { Club, ClubDetails } from '../database/club';

const BASE_URL = getConfig().api.baseUrl;

/** Provides an API for interacting with clubs. */
export type ClubApiContextType = {
    /**
     * Creates the given club.
     * @param club The club to create.
     * @returns An AxiosResponse containing the created club.
     */
    createClub: (club: Partial<Club>) => Promise<AxiosResponse<ClubDetails, any>>;

    /**
     * Fetches the full list of clubs in the database.
     * @param startKey An optional start key to use when searching.
     * @returns A list of all clubs in the database.
     */
    listClubs: (startKey?: string) => Promise<Club[]>;

    /**
     * Fetches the club with the given id.
     * @param id The id of the club to fetch.
     * @returns An AxiosResponse containing the requested club.
     */
    getClub: (id: string) => Promise<AxiosResponse<ClubDetails, any>>;
};

/**
 * Creates the given club.
 * @param idToken The id token of the current signed-in user.
 * @param club The club to create.
 * @returns An AxiosResponse containing the created club.
 */
export function createClub(idToken: string, club: Partial<Club>) {
    return axios.post<ClubDetails>(`${BASE_URL}/clubs`, club, {
        headers: { Authorization: 'Bearer ' + idToken },
    });
}

interface ListClubsResponse {
    clubs: Club[];
    lastEvaluatedKey: string;
}

/**
 * Fetches the full list of clubs in the database.
 * @param startKey An optional start key to use when searching.
 * @returns A list of all clubs in the database.
 */
export async function listClubs(startKey?: string) {
    let params = { startKey };
    const result: Club[] = [];

    do {
        const resp = await axios.get<ListClubsResponse>(`${BASE_URL}/public/clubs`, {
            params,
        });

        result.push(...resp.data.clubs);
        params.startKey = resp.data.lastEvaluatedKey;
    } while (params.startKey);

    return result;
}

/**
 * Fetches the club with the given id.
 * @param id The id of the club to fetch.
 * @returns An AxiosResponse containing the requested club.
 */
export function getClub(id: string) {
    return axios.get<ClubDetails>(`${BASE_URL}/public/clubs/${id}`);
}
