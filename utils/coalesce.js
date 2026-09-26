// Wraps an async function so overlapping calls collapse into at most one
// follow-up run: a call while `fn` is running doesn't start a second copy,
// it marks a rerun that starts once the current one finishes. Callers
// always get the latest result without piling up concurrent runs (e.g. a
// burst of new posts each asking for a trending refresh).
function coalesce(fn) {
  let running = null;
  let rerun = false;

  async function loop() {
    try {
      do {
        rerun = false;
        await fn();
      } while (rerun);
    } finally {
      running = null;
    }
  }

  return function request() {
    if (running) {
      rerun = true;
      return running;
    }
    running = loop();
    return running;
  };
}

module.exports = { coalesce };
