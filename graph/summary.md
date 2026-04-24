# Dependency Graph Summary

- Tools analyzed: 1304
- Edges discovered: 25088
- Tool-to-tool dependency edges: 22548
- User-input fallback edges: 2540

## Toolkit Coverage

- googlesuper: 437
- github: 867

## Most Connected Resources

- email_address: 7294 edges
- github_owner: 4928 edges
- github_repo: 3507 edges
- github_issue_number: 1854 edges
- github_tag: 546 edges
- google_file_id: 498 edges
- google_sheet_range: 497 edges
- google_folder_id: 492 edges
- github_commit_sha: 480 edges
- github_pull_number: 438 edges
- github_branch: 434 edges
- github_team_slug: 360 edges
- google_spreadsheet_id: 306 edges
- google_contact_id: 295 edges
- google_sheet_id: 294 edges

## Representative Tool Dependencies

- `GOOGLESUPER_CALENDAR_LIST_INSERT` -> `GOOGLESUPER_ACL_DELETE` via **Google calendar id** (0.74)
- `GOOGLESUPER_ACL_GET` -> `GOOGLESUPER_ACL_DELETE` via **Google calendar id** (0.74)
- `GOOGLESUPER_ACL_LIST` -> `GOOGLESUPER_ACL_DELETE` via **Google calendar id** (0.74)
- `GOOGLESUPER_CALENDAR_LIST_GET` -> `GOOGLESUPER_ACL_DELETE` via **Google calendar id** (0.74)
- `GOOGLESUPER_CALENDAR_LIST_WATCH` -> `GOOGLESUPER_ACL_DELETE` via **Google calendar id** (0.74)
- `GOOGLESUPER_COLORS_GET` -> `GOOGLESUPER_ACL_DELETE` via **Google calendar id** (0.74)
- `GOOGLESUPER_CALENDAR_LIST_INSERT` -> `GOOGLESUPER_ACL_GET` via **Google calendar id** (0.74)
- `GOOGLESUPER_ACL_LIST` -> `GOOGLESUPER_ACL_GET` via **Google calendar id** (0.74)
- `GOOGLESUPER_CALENDAR_LIST_GET` -> `GOOGLESUPER_ACL_GET` via **Google calendar id** (0.74)
- `GOOGLESUPER_CALENDAR_LIST_WATCH` -> `GOOGLESUPER_ACL_GET` via **Google calendar id** (0.74)
- `GOOGLESUPER_COLORS_GET` -> `GOOGLESUPER_ACL_GET` via **Google calendar id** (0.74)
- `GOOGLESUPER_EVENTS_GET` -> `GOOGLESUPER_ACL_GET` via **Google calendar id** (0.74)
- `GOOGLESUPER_CALENDAR_LIST_INSERT` -> `GOOGLESUPER_ACL_INSERT` via **Email address** (0.74)
- `GOOGLESUPER_CREATE_AUDIENCE_LIST` -> `GOOGLESUPER_ACL_INSERT` via **Email address** (0.74)
- `GOOGLESUPER_ACL_GET` -> `GOOGLESUPER_ACL_INSERT` via **Email address** (0.74)
- `GOOGLESUPER_CALENDAR_LIST_GET` -> `GOOGLESUPER_ACL_INSERT` via **Email address** (0.74)
- `GOOGLESUPER_EVENTS_LIST_ALL_CALENDARS` -> `GOOGLESUPER_ACL_INSERT` via **Email address** (0.74)
- `GOOGLESUPER_FETCH_MESSAGE_BY_MESSAGE_ID` -> `GOOGLESUPER_ACL_INSERT` via **Email address** (0.74)
- `GOOGLESUPER_CALENDAR_LIST_INSERT` -> `GOOGLESUPER_ACL_INSERT` via **Google calendar id** (0.74)
- `GOOGLESUPER_ACL_GET` -> `GOOGLESUPER_ACL_INSERT` via **Google calendar id** (0.74)
- `GOOGLESUPER_ACL_LIST` -> `GOOGLESUPER_ACL_INSERT` via **Google calendar id** (0.74)
- `GOOGLESUPER_CALENDAR_LIST_GET` -> `GOOGLESUPER_ACL_INSERT` via **Google calendar id** (0.74)
- `GOOGLESUPER_CALENDAR_LIST_WATCH` -> `GOOGLESUPER_ACL_INSERT` via **Google calendar id** (0.74)
- `GOOGLESUPER_COLORS_GET` -> `GOOGLESUPER_ACL_INSERT` via **Google calendar id** (0.74)
- `GOOGLESUPER_CALENDAR_LIST_INSERT` -> `GOOGLESUPER_ACL_LIST` via **Google calendar id** (0.74)
- `GOOGLESUPER_ACL_GET` -> `GOOGLESUPER_ACL_LIST` via **Google calendar id** (0.74)
- `GOOGLESUPER_CALENDAR_LIST_GET` -> `GOOGLESUPER_ACL_LIST` via **Google calendar id** (0.74)
- `GOOGLESUPER_CALENDAR_LIST_WATCH` -> `GOOGLESUPER_ACL_LIST` via **Google calendar id** (0.74)
- `GOOGLESUPER_COLORS_GET` -> `GOOGLESUPER_ACL_LIST` via **Google calendar id** (0.74)
- `GOOGLESUPER_EVENTS_GET` -> `GOOGLESUPER_ACL_LIST` via **Google calendar id** (0.74)
- `GOOGLESUPER_CALENDAR_LIST_INSERT` -> `GOOGLESUPER_ACL_PATCH` via **Google calendar id** (0.74)
- `GOOGLESUPER_ACL_GET` -> `GOOGLESUPER_ACL_PATCH` via **Google calendar id** (0.74)
- `GOOGLESUPER_ACL_LIST` -> `GOOGLESUPER_ACL_PATCH` via **Google calendar id** (0.74)
- `GOOGLESUPER_CALENDAR_LIST_GET` -> `GOOGLESUPER_ACL_PATCH` via **Google calendar id** (0.74)
- `GOOGLESUPER_CALENDAR_LIST_WATCH` -> `GOOGLESUPER_ACL_PATCH` via **Google calendar id** (0.74)
- `GOOGLESUPER_COLORS_GET` -> `GOOGLESUPER_ACL_PATCH` via **Google calendar id** (0.74)
- `GOOGLESUPER_CALENDAR_LIST_INSERT` -> `GOOGLESUPER_ACL_UPDATE` via **Google calendar id** (0.74)
- `GOOGLESUPER_ACL_GET` -> `GOOGLESUPER_ACL_UPDATE` via **Google calendar id** (0.74)
- `GOOGLESUPER_ACL_LIST` -> `GOOGLESUPER_ACL_UPDATE` via **Google calendar id** (0.74)
- `GOOGLESUPER_CALENDAR_LIST_GET` -> `GOOGLESUPER_ACL_UPDATE` via **Google calendar id** (0.74)

## Representative User Input Fallbacks

- `GOOGLESUPER_ACL_DELETE` can ask the user for **Email address**
- `GOOGLESUPER_ACL_GET` can ask the user for **Email address**
- `GOOGLESUPER_ACL_INSERT` can ask the user for **Email address**
- `GOOGLESUPER_ACL_LIST` can ask the user for **Email address**
- `GOOGLESUPER_ACL_PATCH` can ask the user for **Email address**
- `GOOGLESUPER_ACL_UPDATE` can ask the user for **Email address**
- `GOOGLESUPER_ACL_WATCH` can ask the user for **Email address**
- `GOOGLESUPER_ADD_ENRICHMENT` can ask the user for **Email address**
- `GOOGLESUPER_ADD_FILE_SHARING_PREFERENCE` can ask the user for **Email address**
- `GOOGLESUPER_ADD_LABEL_TO_EMAIL` can ask the user for **Email address**
- `GOOGLESUPER_ADD_OR_REMOVE_TO_CUSTOMER_LIST` can ask the user for **Email address**
- `GOOGLESUPER_ADD_PARENT` can ask the user for **Email address**
- `GOOGLESUPER_ADD_SHEET` can ask the user for **Google sheet range**
- `GOOGLESUPER_ADD_SHEET` can ask the user for **Email address**
- `GOOGLESUPER_AGGREGATE_COLUMN_DATA` can ask the user for **Email address**
- `GOOGLESUPER_APPEND_DIMENSION` can ask the user for **Email address**
- `GOOGLESUPER_ARCHIVE_CUSTOM_DIMENSION` can ask the user for **Email address**
- `GOOGLESUPER_AUTOCOMPLETE` can ask the user for **Email address**
- `GOOGLESUPER_AUTO_RESIZE_DIMENSIONS` can ask the user for **Google sheet range**
- `GOOGLESUPER_AUTO_RESIZE_DIMENSIONS` can ask the user for **Email address**
- `GOOGLESUPER_BATCH_ADD_MEDIA_ITEMS` can ask the user for **Email address**
- `GOOGLESUPER_BATCH_CLEAR_VALUES_BY_DATA_FILTER` can ask the user for **Google sheet range**
- `GOOGLESUPER_BATCH_CLEAR_VALUES_BY_DATA_FILTER` can ask the user for **Email address**
- `GOOGLESUPER_BATCH_DELETE_MESSAGES` can ask the user for **Email address**
- `GOOGLESUPER_BATCH_EVENTS` can ask the user for **Email address**
