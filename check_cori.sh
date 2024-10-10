#!/bin/bash

# Command or keyword used to start your process
PROCESS_KEYWORD="cori"

# Command to run if the process is not found
START_COMMAND="node ./cori.js"

# Log file for output (change to your desired log path)
LOG_FILE="./logfile.log"

# Function to log messages with timestamp
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

log_message "=== Starting script to check if $PROCESS_KEYWORD is running ==="

# Log the ps aux output
log_message "Current processes matching keyword '$PROCESS_KEYWORD':"
ps aux | grep "$PROCESS_KEYWORD" | grep -v "grep" | grep -v "$0" | tee -a "$LOG_FILE"

# Check if the process is running
if ! ps aux | grep "$PROCESS_KEYWORD" | grep -v "grep" | grep -v "$0" > /dev/null
then
    log_message "$PROCESS_KEYWORD is not running."
    log_message "Starting $PROCESS_KEYWORD with command: $START_COMMAND"
    $START_COMMAND &
    log_message "$PROCESS_KEYWORD started."
else
    log_message "$PROCESS_KEYWORD is already running."
fi

log_message "=== Script execution finished ==="

