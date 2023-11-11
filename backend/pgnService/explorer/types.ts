'use strict';

/** A single position in the games explorer. */
export interface ExplorerPosition {
    /**
     * The normalized FEN of the position. FENs are normalized in the following way:
     * 1. The en passant target square is set to -, unless en passant is currently a legal move.
     * 2. The halfmove clock field is set to 0.
     * 3. The fullmove clock field is set to 1.
     *
     * This is the hash key of the explorer table.
     */
    normalizedFen: string;

    /**
     * Set to the value `POSITION` for all explorer positions. This is the range key of the
     * explorer table and is more useful in the ExplorerGame interface.
     */
    id: string;

    /**
     * The opening of the position, if it has a name.
     */
    opening?: {
        /** The ECO of the opening. */
        eco: string;

        /** The name of the opening */
        name: string;
    };

    /**
     * The moves that continued from this position. A map from the SAN of the move to the
     * ExplorerMove object. Each game that reaches this position is only counted once for
     * a specific SAN. For example, if a game reaches a given FEN twice by repeating moves,
     * and white plays a different move on the second time, that game will be counted twice
     * under two separate SANs. But if a game plays a specific SAN and then plays that same
     * SAN in the same position in an analysis variation, then the game is counted only once
     * under that SAN.
     */
    moves: Record<string, ExplorerMove>;
}

/**
 * An update to an ExplorerPosition for a specific game.
 */
export interface ExplorerPositionUpdate {
    /** The normalized FEN of the position. */
    normalizedFen: string;

    /** The result of the game from this position. */
    result: '1-0' | '0-1' | '1/2-1/2' | 'ANALYSIS';

    /** The moves that continued from this position in the game. */
    moves: Record<string, ExplorerMoveUpdate>;
}

/** A single move option in the games explorer. */
export interface ExplorerMove {
    /** The SAN of the move. */
    san: string;

    /** A map from cohort to ExplorerMoveResult object. */
    results: Record<string, ExplorerMoveResult>;
}

/** A set of results for an ExplorerMove. */
export interface ExplorerMoveResult {
    /** The number of games in which white won. */
    white?: number;

    /** The number of games in which black won. */
    black?: number;

    /** The number of games in which the move drew. */
    draws?: number;

    /**
     * The number of games in which the move appeared only in analysis,
     * and therefore didn't have a traditional result associated.
     */
    analysis?: number;

    /**
     * The number of games in which the move appeared, but the result could
     * not be determined.
     */
    unknown?: number;
}

/** An update to an ExplorerMove. */
export interface ExplorerMoveUpdate {
    /** The SAN of the move. */
    san: string;

    /** The result of the move. */
    result: keyof ExplorerMoveResult;
}

/**
 * A linking between an ExplorerPosition and a game submitted to the Dojo database.
 * Note that each game in the database should only have one associated ExplorerGame for a given
 * ExplorerPosition. So if a game repeats moves or if a certain position shows up in multiple
 * variations, then still only one ExplorerGame object is created.
 */
export interface ExplorerGame {
    /**
     * This is the hash key of the explorer table. See the comment on ExplorerPosition
     * for more info on the format.
     */
    normalizedFen: string;

    /**
     * The range key of the table, in the form GAME#cohort#date_uuid, where GAME is the
     * literal value `GAME`, cohort is the value of the hash key in the games table and
     * date_uuid is the value of the range key in the games table.
     */
    id: string;

    /** The cohort of the game. */
    cohort: string;

    /** The username of the owner of the game. */
    owner: string;

    /** The display name of the owner of the game. */
    ownerDisplayName: string;

    /**
     * The result of the game, as related to the associated FEN. IE: if the FEN does not appear in
     * the mainline of the game and instead appears only in analysis, then this is `ANALYSIS`. Otherwise,
     * it is the result of the game.
     */
    result: '1-0' | '0-1' | '1/2-1/2' | 'ANALYSIS';

    /** The headers of the game. */
    headers: PgnHeaders;
}

/**
 * A user following this position. The user will be notified when a new
 * analysis is uploaded containing this position.
 */
export interface ExplorerPositionFollower {
    /**
     * This is the hash key of the explorer table. See the comment on ExplorerPosition
     * for more info on the format.
     */
    normalizedFen: string;

    /**
     * The range key of the table, in the form FOLLOWER#username, where FOLLOWER is the
     * literal value `FOLLOWER` and username is the username of the follower.
     */
    id: string;

    /**
     * The minimum cohort the new analysis must be in for the user to be notified
     * (inclusive). If not provided, then there is no minimum cohort.
     */
    minCohort?: string;

    /**
     * The maximum cohort the new analysis must be in for the user to be notified
     * (inclusive). If not provided, then there is no maximum cohort.
     */
    maxCohort?: string;

    /**
     * Whether to disable notifications if the position only appears in a variation
     * of the analysis and not the mainline.
     */
    disableVariations?: boolean;
}

/** A game submitted to the Dojo database. */
export interface Game {
    /** The cohort the game belongs to. */
    cohort: string;

    /** The id of the game, in the form date#uuid. */
    id: string;

    /** The date the game was played. */
    date: string;

    /** The username of the submitter of the game. */
    owner: string;

    /** The display name of the submitter of the game. */
    ownerDisplayName: string;

    /** The headers of the PGN. */
    headers: PgnHeaders;

    /** The PGN of the game. */
    pgn: string;
}

/** The header data of a PGN. */
export interface PgnHeaders {
    /** The player with the white pieces. */
    White: string;

    /** The ELO of the player with the white pieces. */
    WhiteElo?: string;

    /** The player with the black pieces. */
    Black: string;

    /** The ELO of the player with the black pieces. */
    BlackElo?: string;

    /** The date the game was played. */
    Date: string;

    /** The site the game was played on. */
    Site: string;

    /** The result of the game. */
    Result: GameResult;

    /** Arbitrary key-value pairs stored in the PGN. */
    [key: string]: string | undefined;
}

/** The result of the game. */
export enum GameResult {
    White = '1-0',
    Black = '0-1',
    Draw = '1/2-1/2',
}
