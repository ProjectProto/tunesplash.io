"""Reject known AI conversation links without printing the matched private URL."""
import argparse
import json
import os
from pathlib import Path
import re
import subprocess
import sys

LINK = re.compile(
    r'https?://(?:www\.)?(?:'
    r'claude\.ai/(?:code/session[_/]|share/|chat/)'
    r'|claude\.com/claude-code/session/'
    r'|(?:chatgpt\.com|chat\.openai\.com)/(?:share/|c/|codex/(?:tasks|sessions)/)'
    r'|gemini\.google\.com/(?:share/|app/)'
    r'|grok\.com/(?:share/|chat/)'
    r'|aistudio\.google\.com/(?:prompts/|app/prompts/)'
    r'|(?:copilot\.microsoft\.com|copilot\.com)/(?:shares/|chats/)'
    r'|poe\.com/s/'
    r')[A-Za-z0-9_-]+|codex://threads/[A-Za-z0-9_-]+', re.I)
TRAILER = re.compile(r'^(?:Claude|Codex|AI|Agent)-Session\s*:', re.I | re.M)

def contains_private_link(text):
    return bool(LINK.search(text) or TRAILER.search(text))

def git(*args):
    return subprocess.check_output(['git', *args]).decode('utf-8', errors='replace')

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--message', type=Path)
    parser.add_argument('--self-test', action='store_true')
    parser.add_argument('--push', action='store_true')
    args = parser.parse_args()
    if args.self_test:
        domains_paths = [('claude.ai','code/session_example'),('claude.ai','share/example'),
                        ('chatgpt.com','share/example'),('chatgpt.com','codex/tasks/task_example'),
                        ('gemini.google.com','share/example'),('grok.com','share/example'),
                        ('aistudio.google.com','prompts/example'),('copilot.microsoft.com','shares/example')]
        assert all(contains_private_link('https://' + d + '/' + p) for d,p in domains_paths)
        assert contains_private_link('Claude' + '-Session: withheld')
        assert not contains_private_link('https://code.claude.com/docs/en/settings-reference')
        assert not contains_private_link('https://learn.chatgpt.com/docs/developer-settings')
        print('Session privacy guard self-test passed.')
        return 0
    findings = []
    if args.push:
        for line in sys.stdin:
            fields = line.split()
            if len(fields) != 4:
                raise ValueError('Unexpected Git push input')
            _, new, _, old = fields
            if not all(re.fullmatch(r'[0-9a-fA-F]{40,64}', value) for value in (new,old)):
                raise ValueError('Unexpected Git object identifier')
            if set(new) == {'0'}:
                continue
            revisions = [new, '--not', '--remotes'] if set(old) == {'0'} else [old+'..'+new]
            if contains_private_link(git('log',*revisions,'--format=%B','-p','--no-ext-diff','--no-color')):
                findings.append('outgoing commits or files')
    elif args.message:
        if contains_private_link(args.message.read_text(encoding='utf-8', errors='replace')):
            findings.append('proposed commit message')
        if contains_private_link(git('diff','--cached','--no-ext-diff','--no-color')):
            findings.append('staged changes')
    else:
        commits = git('log','--all','--format=%H%x00%B%x00').split('\x00')
        for i in range(0,len(commits)-1,2):
            if contains_private_link(commits[i+1]):
                findings.append('commit ' + commits[i].strip()[:12])
        # Git history includes deleted files; no matched contents are printed.
        if contains_private_link(git('log','--all','-p','--format=','--no-ext-diff','--no-color')):
            findings.append('file history')
        if contains_private_link(git('diff','HEAD','--no-ext-diff','--no-color')):
            findings.append('working changes')
        event = os.environ.get('GITHUB_EVENT_PATH')
        if event:
            data = json.loads(Path(event).read_text(encoding='utf-8'))
            pr = data.get('pull_request') or {}
            if contains_private_link((pr.get('title') or '')+'\n'+(pr.get('body') or '')):
                findings.append('pull request title or body')
    if findings:
        print('Blocked AI session/transcript link in: ' + ', '.join(findings), file=sys.stderr)
        print('Remove the private reference; do not publish its value in logs.', file=sys.stderr)
        return 1
    print('No known AI session links found in the checked content.')
    return 0

if __name__ == '__main__':
    sys.exit(main())
