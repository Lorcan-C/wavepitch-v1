#!/bin/bash

# WavePitch Context Loading Script - Core Feature Files
# Loads the key files that show how the app actually works

echo "# WavePitch Core Feature Context - $(date)"
echo

# Core feature files that define how the app works
files=(
    "src/meetings/pages/MeetingPage.tsx"
    "src/meetings/components/MeetingInterface.tsx"
    "src/stores/meeting-store.ts"
    "src/meetings/types/index.ts"
    "src/hooks/useMeetingSTT.ts"
    "src/services/NextSpeakerService.ts"
    "src/lib/supabase.ts"
    "src/App.tsx"
    "package.json"
    "DEVELOPMENT.md"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "## $file"
        echo '```'
        cat "$file"
        echo '```'
        echo
    else
        echo "## $file (not found)"
        echo
    fi
done

echo "✅ Core feature files loaded - Ready to code with WavePitch patterns"