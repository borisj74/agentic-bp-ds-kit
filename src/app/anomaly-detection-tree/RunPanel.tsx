import { Accordion } from "@/ui/Accordion/Accordion";
import { Badge } from "@/ui/Badge/Badge";
import { Callout } from "@/ui/Callout/Callout";
import { Meter } from "@/ui/Meter/Meter";
import { Section } from "@/ui/Section/Section";
import { RESULT_INTENT, RESULT_WORD, type Result } from "../anomaly-detection/data";
import type { RecordType } from "../anomaly-detection-nodes/graph";
import type { Stage } from "./tree";
import styles from "./page.module.css";

// What a run says at each stage, beside the tree. The wording follows the wizard's own run screens.

// How far training or applying has got. A real progress bar, since the header's Badge is only for status.
export function RunProgress({ stage, progress, checked, type }: { stage: Stage; progress: number; checked: number; type: RecordType }) {
  if (stage === "training") {
    return (
      <div className={styles.progress}>
        <div className={styles.progressHead}>
          <strong>Training the model: {progress}% done</strong>
          <span className={styles.quiet}>Usually 10 to 15 minutes</span>
        </div>
        <Meter label="Training progress" value={progress} size="md" />
      </div>
    );
  }
  if (stage === "applying") {
    return (
      <div className={styles.progress}>
        <div className={styles.progressHead}>
          <strong>Applying to all {type.many}: {Math.round((checked * progress) / 100).toLocaleString("en-US")} of {checked.toLocaleString("en-US")}</strong>
        </div>
        <Meter label={`${type.label} checked`} value={progress} size="md" />
      </div>
    );
  }
  return null;
}

export function RunPanel({ stage, result, checked, paused, type }: {
  stage: Stage; result: Result; checked: number; paused: boolean; type: RecordType;
}) {
  const all = checked.toLocaleString("en-US");
  if (stage === "training") {
    return (
      <>
        <Callout closeButton intent="info" title="You can leave this page">Training keeps running in the background. Nothing happens to {type.many}.</Callout>
      </>
    );
  }
  if (stage === "results") {
    const poor = result.kind === "poor";
    return (
      <>
        <Section title="Result" heading="sm" line="thin" spacing="tight">
          <div className={styles.score}>
            <div className={styles.scoreHead}>
              <Badge intent={RESULT_INTENT[result.kind]} emphasis="strong" size="lg">{RESULT_WORD[result.kind]}</Badge>
              <span>{result.score.toFixed(1)} out of 10</span>
            </div>
            {poor ? (
              <>
                <p>It misses most {type.odd} and would flag many normal {type.many}. Don&apos;t turn it on yet.</p>
                <p className={styles.quiet}>Too many values add noise. Watch fewer of them, then train again. Standard rate and Tax amount move with Rate and Cost.</p>
              </>
            ) : (
              <>
                <p>It catches most {type.odd}, with a few false flags. In a test, it found about 6 in 10 planted problems, and 6 in 10 of its flags were real.</p>
                <p className={styles.quiet}>So far it has only seen a 5% sample, and nothing has happened to any {type.one}. Next: apply it to all your {type.many}.</p>
              </>
            )}
          </div>
        </Section>
        <Accordion
          items={[{
            id: "metrics", title: "Technical details: metrics",
            content: poor
              ? "Precision 0.21 · Recall 0.34 · F1 0.26 · ROC-AUC 0.71 · Flag rate 18% · Model version 1"
              : "Precision 0.62 · Recall 0.63 · F1 0.63 · ROC-AUC 0.97 · PR-AUC 0.68 · Flag rate 7% · Model version 1",
          }]}
        />
      </>
    );
  }
  if (stage === "applying") {
    return <Callout closeButton intent="info" title="You can leave this page">This keeps running in the background and can take a while with many {type.many}. Nothing happens to {type.many}.</Callout>;
  }
  if (stage === "ready") {
    return (
      <>
        <Callout closeButton intent="success" title={`All ${all} ${type.many} checked`}>The model is ready. Turn on detection to start checking new {type.many}.</Callout>
        <Callout closeButton intent="info" title="What happens when you turn it on">{type.when} The steps after the Model start applying to new flags.</Callout>
      </>
    );
  }
  if (stage === "on") {
    return paused
      ? <Callout closeButton intent="warning" title="Detection is paused">New {type.many} aren&apos;t checked and the steps after the Model don&apos;t run.</Callout>
      : <Callout closeButton intent="success" title="Detection is on">Only {type.newOnes} are checked from now on. The counts on the tree are past {type.many}, and none of them were changed.</Callout>;
  }
  return null;
}
