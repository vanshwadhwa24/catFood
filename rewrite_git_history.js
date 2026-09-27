import { execSync } from 'child_process';

try {
    console.log("Fetching commits...");
    // 1. Get all commits on the current branch (oldest to newest)
    const commitsOutput = execSync('git log --reverse --format="%H"', { encoding: 'utf8' }).trim();
    if (!commitsOutput) {
        console.error("No commits found.");
        process.exit(1);
    }
    const commits = commitsOutput.split('\n').filter(Boolean);
    console.log(`Found ${commits.length} commits.`);

    // 2. Define start and end times (27th September 2026, 12:00 AM to 6:00 PM IST)
    const startTime = new Date('2026-09-27T00:00:00+05:30').getTime();
    const endTime = new Date('2026-09-27T18:00:00+05:30').getTime();
    
    // Interval between commits in milliseconds
    const interval = commits.length > 1 
        ? Math.floor((endTime - startTime) / (commits.length - 1)) 
        : 0;

    // 3. Keep track of the original branch name
    const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    if (!currentBranch) {
        console.error("Not currently on any branch.");
        process.exit(1);
    }

    // 4. Start rewriting history
    const tempBranch = 'rewrite_history_temp';
    
    // Ensure we don't have lingering temp branch
    try { execSync(`git branch -D ${tempBranch}`, { stdio: 'pipe' }); } catch(e) {}

    // Create temp branch at the first commit
    console.log(`\nStarting with first commit: ${commits[0]}`);
    execSync(`git checkout -b ${tempBranch} ${commits[0]}`, { stdio: 'inherit' });
    
    // Amend the first commit
    const firstDate = new Date(startTime).toISOString();
    process.env.GIT_COMMITTER_DATE = firstDate;
    execSync(`git commit --amend --date="${firstDate}" --no-edit`, { stdio: 'inherit' });

    // 5. Cherry-pick and amend the remaining commits
    for (let i = 1; i < commits.length; i++) {
        const commitHash = commits[i];
        console.log(`Processing commit ${i + 1}/${commits.length}: ${commitHash.substring(0, 7)}`);
        
        try {
            execSync(`git cherry-pick ${commitHash}`, { stdio: 'inherit' });
        } catch (e) {
            console.log("Empty commit or conflict encountered. Skipping...");
            try { execSync('git cherry-pick --skip', { stdio: 'pipe' }); } catch(err) {
                execSync('git cherry-pick --abort', { stdio: 'pipe' });
            }
            continue;
        }

        const commitTime = startTime + (interval * i);
        const commitDate = new Date(commitTime).toISOString();
        
        process.env.GIT_COMMITTER_DATE = commitDate;
        execSync(`git commit --amend --date="${commitDate}" --no-edit`, { stdio: 'inherit' });
    }

    // 6. Replace the old branch with the new one
    console.log('\nReplacing old branch with the new history...');
    execSync(`git checkout ${currentBranch}`, { stdio: 'inherit' });
    execSync(`git reset --hard ${tempBranch}`, { stdio: 'inherit' });
    execSync(`git branch -D ${tempBranch}`, { stdio: 'inherit' });

    console.log('\n✅ History rewritten successfully!');
    console.log('You can check the new dates by running: git log --format="%h - %s - %cd"');
    console.log(`\nTo push the new history, run: git push --force origin ${currentBranch}`);

} catch (error) {
    console.error('\n❌ An error occurred:', error.message);
    // Cleanup on error
    try {
        const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
        if (currentBranch === 'rewrite_history_temp') {
            execSync('git checkout main', { stdio: 'pipe' });
        }
    } catch(e) {}
}
