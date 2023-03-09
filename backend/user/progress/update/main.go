package main

import (
	"context"
	"encoding/json"
	"time"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

const funcName = "user-progress-update-handler"

var repository database.UserProgressUpdater = database.DynamoDB

type ProgressUpdateRequest struct {
	RequirementId           string              `json:"requirementId"`
	IncrementalCount        int                 `json:"incrementalCount"`
	IncrementalMinutesSpent int                 `json:"incrementalMinutesSpent"`
	Cohort                  database.DojoCohort `json:"cohort"`
}

func Handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)

	info := api.GetUserInfo(event)
	if info.Username == "" {
		return api.Failure(funcName, errors.New(400, "Invalid request: username is required", "")), nil
	}

	request := &ProgressUpdateRequest{}
	if err := json.Unmarshal([]byte(event.Body), request); err != nil {
		return api.Failure(funcName, errors.Wrap(400, "Invalid request: unable to unmarshal request body", "", err)), nil
	}
	if request.RequirementId == "" {
		return api.Failure(funcName, errors.New(400, "Invalid request: requirementId is required", "")), nil
	}
	if request.Cohort == "" {
		return api.Failure(funcName, errors.New(400, "Invalid request: cohort is required", "")), nil
	}

	requirement, err := repository.GetRequirement(request.RequirementId)
	if err != nil {
		return api.Failure(funcName, err), nil
	}

	user, err := repository.GetUser(info.Username)
	if err != nil {
		return api.Failure(funcName, err), nil
	}

	progress, ok := user.Progress[request.RequirementId]
	if !ok {
		progress = &database.RequirementProgress{
			RequirementId: request.RequirementId,
			Counts:        make(map[database.DojoCohort]int),
			MinutesSpent:  make(map[database.DojoCohort]int),
		}
	}
	originalCount := progress.Counts[request.Cohort]

	progress.Counts[request.Cohort] += request.IncrementalCount
	progress.MinutesSpent[request.Cohort] += request.IncrementalMinutesSpent
	progress.UpdatedAt = time.Now().Format(time.RFC3339)

	totalCount, ok := requirement.Counts[request.Cohort]
	if !ok {
		totalCount, _ = requirement.Counts[database.AllCohorts]
	}

	timelineEntry := &database.TimelineEntry{
		RequirementId:       request.RequirementId,
		RequirementName:     requirement.Name,
		RequirementCategory: requirement.Category,
		ScoreboardDisplay:   requirement.ScoreboardDisplay,
		Cohort:              request.Cohort,
		TotalCount:          totalCount,
		PreviousCount:       originalCount,
		NewCount:            originalCount + request.IncrementalCount,
		MinutesSpent:        request.IncrementalMinutesSpent,
		CreatedAt:           time.Now().Format(time.RFC3339),
	}

	user, err = repository.UpdateUserProgress(info.Username, progress, timelineEntry)
	if err != nil {
		return api.Failure(funcName, err), nil
	}
	return api.Success(funcName, user), nil
}

func main() {
	lambda.Start(Handler)
}
