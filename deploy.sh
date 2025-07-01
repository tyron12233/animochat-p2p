#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# --- Configuration ---
# Use $HOME for correct path expansion
P2P_REPO_PATH="$HOME/NodeProjects/animochat-p2p"
TURN_SERVER_REPO_PATH="$HOME/NodeProjects/animochat-turn-server"

# IMPORTANT: Add files or directories to keep.
# Any directory listed here will be kept with all its contents.
FILES_TO_KEEP=(".gitignore" "CNAME" ".elasticbeanstalk" ".nojekyll" "node_modules")

# --- 1. Clean the TURN server repository ---
echo "Cleaning the TURN server repository..."
cd "$TURN_SERVER_REPO_PATH"

# Build the arguments for the find command to prune (keep) specified files/dirs.
prune_paths=()
for item in "${FILES_TO_KEEP[@]}"; do
  prune_paths+=(-o -name "$item")
done

# The final find command will:
# 1. Look for the files/dirs to keep and -prune them (don't traverse into them).
# 2. For everything else (-o), delete it.
# We remove the initial '-o' from the array for correct syntax.
if [ ${#prune_paths[@]} -gt 0 ]; then
  find . -mindepth 1 \( "${prune_paths[@]:1}" \) -prune -o -exec rm -rf {} +
fi

echo "TURN server repository cleaned."

# --- 2. Build the p2p project ---
echo "Building the p2p project..."
cd "$P2P_REPO_PATH"
bun run build
echo "p2p project built successfully."

# --- 3. Move the build files ---
echo "Moving build files to the TURN server repository..."
# The trailing slash on the source path ensures the contents are moved.
mv "$P2P_REPO_PATH/dist/"* "$TURN_SERVER_REPO_PATH/"
echo "Build files moved."

# --- 4. Get the latest commit message from the p2p repo ---
echo "Fetching the latest commit message from the p2p repository..."
cd "$P2P_REPO_PATH"
COMMIT_MESSAGE=$(git log -1 --pretty=%B)
echo "Latest commit message: $COMMIT_MESSAGE"

# --- 5. Commit and push to the TURN server repo ---
echo "Committing and pushing changes to the TURN server repository..."
cd "$TURN_SERVER_REPO_PATH"
git add .
git commit -m "$COMMIT_MESSAGE"
git push
echo "Deployment complete! 🎉"