import pytest
from app.github.client import github_client, GitHubClientError

def test_validate_repo_params_valid():
    # Should not raise exception
    github_client._validate_repo_params("facebook", "react")
    github_client._validate_repo_params("google-deepmind", "antigravity.js")

def test_validate_repo_params_invalid():
    with pytest.raises(GitHubClientError) as exc_info:
        github_client._validate_repo_params("bad/owner", "repo")
    assert exc_info.value.status_code == 400

    with pytest.raises(GitHubClientError):
        github_client._validate_repo_params("owner", "repo;rm -rf")
