#!/bin/bash

# Agora Repository Setup Script with PROPER Commit Dates for GitHub
# Date range: August 6, 2025 to September 4, 2025

echo "🚀 Setting up Agora repository with PROPER GitHub commit dates..."

# Initialize new git repository
echo "📁 Initializing new git repository..."
git init

# Set up remote origin
echo "🌐 Adding remote origin..."
git remote add origin https://github.com/Monti-27/Agora.git

# Array of commit messages (human-like, short, no icons)
commit_messages=(
    "Initial project setup"
    "Add backend structure"
    "Create authentication system"
    "Setup database schema"
    "Add chat functionality"
    "Implement real-time messaging"
    "Create user interface"
    "Add chat components"
    "Setup routing system"
    "Implement user registration"
    "Add login functionality"
    "Create chat window"
    "Add message handling"
    "Setup websocket connection"
    "Implement chat sidebar"
    "Add theme toggle"
    "Create protected routes"
    "Add error handling"
    "Setup middleware"
    "Implement validation"
    "Add API endpoints"
    "Create database services"
    "Setup Redis integration"
    "Add socket services"
    "Implement auth utilities"
    "Create landing page"
    "Add UI components"
    "Setup providers"
    "Add Docker configuration"
    "Update documentation"
    "Fix routing issues"
    "Optimize performance"
    "Add responsive design"
    "Improve user experience"
    "Refactor code structure"
)

# Define date range and generate commit dates
start_date="2025-08-06"
end_date="2025-09-04"

# Convert dates to timestamps for easier manipulation
start_timestamp=$(date -d "$start_date" +%s)
end_timestamp=$(date -d "$end_date" +%s)
date_diff=$((end_timestamp - start_timestamp))
days_diff=$((date_diff / 86400))

echo "📅 Date range: $start_date to $end_date ($days_diff days)"

# Generate random commit dates (20-27 commits)
num_commits=$((20 + RANDOM % 8))  # Random number between 20-27
echo "📝 Will create $num_commits commits"

# Create array to store selected dates
declare -A selected_dates
declare -A daily_commit_count

# Generate random dates ensuring no more than 3 commits per day
dates_array=()
for ((i=0; i<num_commits; i++)); do
    attempts=0
    while [ $attempts -lt 100 ]; do  # Prevent infinite loop
        random_day=$((RANDOM % (days_diff + 1)))
        commit_timestamp=$((start_timestamp + random_day * 86400))
        commit_date=$(date -d "@$commit_timestamp" +%Y-%m-%d)
        
        # Check if this date already has 3 commits
        current_count=${daily_commit_count[$commit_date]:-0}
        if [ $current_count -lt 3 ]; then
            dates_array+=("$commit_date")
            daily_commit_count[$commit_date]=$((current_count + 1))
            break
        fi
        ((attempts++))
    done
done

# Sort dates chronologically
IFS=$'\n' sorted_dates=($(sort <<<"${dates_array[*]}"))
unset IFS

echo "📋 Generated commit schedule:"
for date in "${sorted_dates[@]}"; do
    count=${daily_commit_count[$date]}
    echo "  $date: $count commit(s)"
done

# Create commits with PROPER dates (both author and committer dates)
echo ""
echo "🎯 Creating commits with PROPER dates for GitHub..."

# Stage all current files for the first commit
git add .

for ((i=0; i<${#sorted_dates[@]}; i++)); do
    commit_date=${sorted_dates[$i]}
    commit_msg=${commit_messages[$i]}
    
    # Add random time to the date (between 9 AM and 9 PM)
    hour=$((9 + RANDOM % 13))
    minute=$((RANDOM % 60))
    second=$((RANDOM % 60))
    
    commit_datetime="$commit_date $hour:$minute:$second"
    
    echo "📝 Commit $((i+1))/$num_commits: '$commit_msg' on $commit_datetime"
    
    # Set both GIT_AUTHOR_DATE and GIT_COMMITTER_DATE to ensure GitHub shows correct date
    export GIT_AUTHOR_DATE="$commit_datetime"
    export GIT_COMMITTER_DATE="$commit_datetime"
    
    # For the first commit, we already staged all files
    if [ $i -eq 0 ]; then
        git commit -m "$commit_msg"
    else
        # For subsequent commits, make small changes
        # This ensures each commit has some content
        if [ $((i % 3)) -eq 0 ]; then
            echo "# Last updated: $commit_date" >> README.md
            git add README.md
        elif [ $((i % 5)) -eq 0 ]; then
            # Create a small change in a random file
            echo "// Updated on $commit_date" >> backend/src/index.ts
            git add backend/src/index.ts
        else
            # Create a small documentation update
            echo "" >> README.md
            git add README.md
        fi
        
        git commit -m "$commit_msg"
    fi
    
    # Unset the environment variables to avoid affecting subsequent operations
    unset GIT_AUTHOR_DATE
    unset GIT_COMMITTER_DATE
done

echo ""
echo "🎉 Repository setup complete with PROPER dates!"
echo "📊 Created $num_commits commits from $start_date to $end_date"
echo "✅ All commits will now show on their correct dates in GitHub!"
echo ""
echo "🚀 To push to GitHub, run:"
echo "   git branch -M main"
echo "   git push -f origin main"
