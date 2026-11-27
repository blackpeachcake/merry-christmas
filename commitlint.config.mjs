// Conventional Commits: feat | fix | chore | docs | style | refactor | test | ci | build | perf | revert
// 예) feat(web): 에디터 텍스트 블록 추가
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // 한글 제목을 쓰므로 대소문자 규칙은 끈다.
    "subject-case": [0],
    // Co-Authored-By 등 트레일러가 길어질 수 있어 본문/푸터 줄 길이 제한을 끈다.
    "body-max-line-length": [0],
    "footer-max-line-length": [0],
  },
};
