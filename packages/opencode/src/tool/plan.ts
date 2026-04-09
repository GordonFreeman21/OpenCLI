import z from "zod"
import path from "path"
import { Tool } from "./tool"
import { Question } from "../question"
import { Session } from "../session"
import { MessageV2 } from "../session/message-v2"
import { Provider } from "../provider/provider"
import { Instance } from "../project/instance"
import { type SessionID, MessageID, PartID } from "../session/schema"
import EXIT_DESCRIPTION from "./plan-exit.txt"
import { Autopilot } from "@/autopilot"

const ENTER_DESCRIPTION = `Use this tool to switch from build mode into plan mode for the current session.

Use it when the task is non-trivial and you should first research the codebase, write a concrete plan file, and then return to implementation.`

async function getLastModel(sessionID: SessionID) {
  for await (const item of MessageV2.stream(sessionID)) {
    if (item.info.role === "user" && item.info.model) return item.info.model
  }
  return Provider.defaultModel()
}

async function switchAgent(input: {
  sessionID: SessionID
  agent: "plan" | "build"
  text: string
  model: Awaited<ReturnType<typeof getLastModel>>
}) {
  const userMsg: MessageV2.User = {
    id: MessageID.ascending(),
    sessionID: input.sessionID,
    role: "user",
    time: {
      created: Date.now(),
    },
    agent: input.agent,
    model: input.model,
  }
  await Session.updateMessage(userMsg)
  await Session.updatePart({
    id: PartID.ascending(),
    messageID: userMsg.id,
    sessionID: input.sessionID,
    type: "text",
    text: input.text,
    synthetic: true,
  } satisfies MessageV2.TextPart)
}

export const PlanExitTool = Tool.define("plan_exit", {
  description: EXIT_DESCRIPTION,
  parameters: z.object({}),
  async execute(_params, ctx) {
    const session = await Session.get(ctx.sessionID)
    const plan = path.relative(Instance.worktree, Session.plan(session))
    const model = await getLastModel(ctx.sessionID)

    if (!Autopilot.isEnabled()) {
      const answers = await Question.ask({
        sessionID: ctx.sessionID,
        questions: [
          {
            question: `Plan at ${plan} is complete. Would you like to switch to the build agent and start implementing?`,
            header: "Build Agent",
            custom: false,
            options: [
              { label: "Yes", description: "Switch to build agent and start implementing the plan" },
              { label: "No", description: "Stay with plan agent to continue refining the plan" },
            ],
          },
        ],
        tool: ctx.callID ? { messageID: ctx.messageID, callID: ctx.callID } : undefined,
      })
      const answer = answers[0]?.[0]
      if (answer === "No") throw new Question.RejectedError()
    }

    await switchAgent({
      sessionID: ctx.sessionID,
      agent: "build",
      model,
      text: `The plan at ${plan} has been approved, you can now edit files. Execute the plan`,
    })

    return {
      title: "Switching to build agent",
      output: Autopilot.isEnabled()
        ? "Autopilot approved switching to build agent. Continue executing the plan."
        : "User approved switching to build agent. Wait for further instructions.",
      metadata: {},
    }
  },
})

export const PlanEnterTool = Tool.define("plan_enter", {
  description: ENTER_DESCRIPTION,
  parameters: z.object({}),
  async execute(_params, ctx) {
    const session = await Session.get(ctx.sessionID)
    const plan = path.relative(Instance.worktree, Session.plan(session))

    if (!Autopilot.isEnabled()) {
      const answers = await Question.ask({
        sessionID: ctx.sessionID,
        questions: [
          {
            question: `Would you like to switch to the plan agent and create a plan saved to ${plan}?`,
            header: "Plan Mode",
            custom: false,
            options: [
              { label: "Yes", description: "Switch to plan agent for research and planning" },
              { label: "No", description: "Stay with build agent to continue making changes" },
            ],
          },
        ],
        tool: ctx.callID ? { messageID: ctx.messageID, callID: ctx.callID } : undefined,
      })

      const answer = answers[0]?.[0]
      if (answer === "No") throw new Question.RejectedError()
    }

    const model = await getLastModel(ctx.sessionID)
    await switchAgent({
      sessionID: ctx.sessionID,
      agent: "plan",
      model,
      text: "Switch to plan mode and create or refine the session plan before implementation.",
    })

    return {
      title: "Switching to plan agent",
      output: Autopilot.isEnabled()
        ? `Autopilot entered plan mode. The plan file will be at ${plan}. Research, write the plan, then call plan_exit to continue execution.`
        : `User confirmed plan mode. The plan file will be at ${plan}. Begin planning.`,
      metadata: {},
    }
  },
})
