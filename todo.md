# Personal AI Assistant - Development TODO

## Database & Schema
- [x] Create Tasks table
- [x] Create Projects table
- [x] Create Habits table
- [x] Create Sleep table
- [x] Create Gym/Diet table
- [x] Create Daily Review table
- [x] Add Google Calendar integration fields to Users table
- [x] Add Telegram integration fields to Users table
- [x] Run migrations and apply SQL

## Core APIs (tRPC Procedures)
- [x] Tasks CRUD (create, read, update, delete, complete)
- [x] Projects CRUD (create, read, update, delete)
- [x] Habits logging and retrieval
- [x] Sleep tracking API
- [x] Gym/Diet logging API
- [x] Daily Review API
- [x] Task filtering by project, status, due_date
- [x] Habit filtering by type and date

## Frontend UI - Dashboard Layout
- [x] Set up DashboardLayout with sidebar navigation
- [x] Create main dashboard page with overview
- [x] Implement responsive design

## Frontend UI - Tasks
- [x] Task list page with filters
- [x] Create task form
- [x] Edit task modal
- [x] Mark task complete
- [x] Delete task

## Frontend UI - Projects
- [x] Projects list page
- [x] Create project form
- [x] Edit project (name, stage, progress, next_action, blocker)
- [x] Delete project
- [x] Project detail view with associated tasks

## Frontend UI - Habit Tracker
- [x] Habit logging form
- [x] Habit history view
- [x] Habit statistics/trends

## Frontend UI - Sleep Tracker
- [x] Sleep logging form
- [x] Sleep history view
- [x] Sleep quality trends

## Frontend UI - Gym & Diet
- [x] Gym/Diet logging form
- [x] History view with metrics
- [x] Weight tracking chart

## Frontend UI - Daily Review
- [x] Daily review form (wins, misses, mood, energy, tomorrow_focus)
- [x] Review history view
- [x] Daily summary display

## Integrations - Google Calendar
- [ ] OAuth 2.0 setup for Google Calendar
- [ ] Create calendar events from tasks with scheduled_time
- [ ] Update calendar events when tasks change
- [ ] Delete calendar events when tasks are deleted
- [ ] Store google_event_id in tasks table

## Integrations - Telegram
- [ ] Set up Telegram bot
- [ ] Implement /start command to capture chat_id
- [ ] Create task reminder scheduler (every 5 minutes)
- [ ] Create morning plan summary scheduler (7:00 AM)
- [ ] Create night review summary scheduler (9:00 PM)
- [ ] Send Telegram messages via bot API

## AI Features
- [ ] Convert raw thoughts to structured tasks (LLM integration)
- [ ] Generate daily plan from tasks + projects
- [ ] Summarize daily activity
- [ ] Generate weekly insights (habits, productivity, trends)
- [ ] Create API endpoints for AI features

## Testing
- [x] Write vitest tests for core procedures
- [x] Test task CRUD operations
- [x] Test project management
- [x] Test habit tracking
- [x] Test integrations

## Deployment & Polish
- [ ] Final UI polish and responsiveness check
- [ ] Error handling and validation
- [ ] Loading states and empty states
- [ ] Create checkpoint before delivery

## AI Features - Raw Thought to Task
- [x] Create LLM endpoint to process raw thoughts
- [x] Parse AI response and create tasks from structured output
- [x] Build UI component for thought input
- [x] Add thought history/log
- [x] Test AI processing accuracy

## AI Features - Weekly Insights
- [x] Create API endpoint to generate weekly insights
- [x] Analyze task completion rates and productivity trends
- [x] Analyze habit patterns and triggers
- [x] Calculate sleep quality and consistency metrics
- [x] Generate AI-powered recommendations
- [x] Build weekly insights UI with charts
- [x] Display productivity trends, habit analysis, and recommendations
- [x] Test insights generation and accuracy

## AI Features - Daily Plan Generation
- [x] Create API endpoint to generate daily plan
- [x] Analyze pending tasks and their priorities
- [x] Consider energy levels from previous reviews
- [x] Generate optimized schedule with time blocks
- [x] Provide task recommendations and order
- [x] Build daily plan UI with schedule view
- [x] Display task recommendations and time blocks
- [x] Add ability to adjust plan and save preferences
- [x] Test daily plan generation accuracy


## Telegram Integration
- [x] Set up Telegram bot credentials and webhooks
- [x] Create endpoint to send daily plan via Telegram
- [x] Send task reminders at scheduled times
- [x] Send morning plan summary
- [x] Send evening review prompt
- [x] Handle Telegram user linking/authentication

## Google Calendar Integration
- [x] Set up Google Calendar OAuth flow
- [x] Create endpoint to sync tasks to calendar
- [x] Auto-create events from daily plan time blocks
- [x] Update events when tasks are modified
- [x] Delete events when tasks are completed
- [x] Handle bidirectional sync

## Habit Trigger Notifications
- [x] Create notification system for high-risk triggers
- [x] Send alerts when trigger patterns detected
- [x] Provide coping strategies in notifications
- [x] Track notification effectiveness
- [x] Allow user to customize notification frequency

## UI/UX Enhancements
- [x] Update color scheme with modern gradient palette
- [x] Add animations and micro-interactions
- [x] Enhance card designs with shadows and depth
- [x] Improve typography and spacing
- [x] Add icons and visual indicators
- [x] Create consistent design system
- [x] Optimize mobile responsiveness
- [x] Add dark mode support


## Habit Trigger Detection Engine
- [x] Create trigger pattern detection logic
- [x] Analyze urge level trends and spikes
- [x] Detect trigger contexts (time, location, mood)
- [x] Identify high-risk situations (urge > 7)
- [x] Generate AI-powered coping strategies
- [x] Create alert scheduling system
- [x] Send proactive alerts before high-risk situations
- [x] Track alert effectiveness and user responses
- [x] Test trigger detection accuracy
