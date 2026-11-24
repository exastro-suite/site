---
layout: message
message_id: exastro
title: "My Dream for Exastro (Koichi Yoshida) | Developer Stories"
description: "Our core ideas stay the same. With AI, they gain new possibilities. Koichi Yoshida, developer of Exastro, talks about how it all started, the challenge of Agentic AI, and his commitment to releasing Exastro as open source."
lang: en
alternate_url: /message/exastro.html
profile:
  - "Koichi Yoshida graduated from the Graduate School of Energy Science, Kyoto University, and joined NEC in 2006. At NEC, he mainly worked for large telecom carriers, designing system architectures, development processes, and operation processes. While he was busy working as a system engineer, he saw a problem: the work of creating digital systems was itself analog, manual, and inefficient. Around 2015, he began working to digitize, automate, and streamline system development, setup, and operations. In 2019, he released IT Automation, the first software in the Exastro Suite, as open source. He has held his current position since 2022."
---
## Systems keep getting more complex, and engineers keep getting fewer

The IT systems that support our lives and businesses keep evolving. Society expects IT to play a wider role, so systems are becoming larger and more complex. The speed of change also keeps increasing. At the same time, there are not enough system engineers to support these systems, and the shortage is getting more serious.

What happens when the work keeps growing but there are not enough people? The engineers who are already there will have to carry the extra load, and it is easy to see that they will become exhausted. And when young people see these experienced engineers, will they really think, "I want to be a system engineer too"? For a long time, I have wanted to break this negative cycle.

IT is meant to make people's lives and work easier and richer. So if the engineers who create and support IT are always struggling with inefficient work, isn't something wrong?

I want to create a smart way of working that anyone would call cool. I want to build a world where engineers can use their knowledge and creativity to create new value, instead of spending their days on routine tasks. That is the starting point for all our work on Exastro.

## How it all started

### Something isn't right: did the engineers behind a smart world really work in a smart way?

When I first joined a project to develop and set up systems, I had high expectations. I believed I would be working at the leading edge of IT. But the real workplace was not what I had imagined.

Design information was scattered across Excel and other files. Engineers configured settings by hand, and the quality of the work depended heavily on each person's knowledge and experience. We spent huge amounts of time checking and worked very carefully, but because we are human, we could never remove mistakes completely. We were building advanced IT systems, yet the way we built them was surprisingly manual.

At the time, however, this was normal. I also gained experience and improved my skills within that way of working. Then something happened that this "normal" could no longer handle.

### The event that pushed us beyond our limits

From 2010 to 2015, Japan shifted rapidly from feature phones to smartphones. We were in charge of systems for a telecom carrier. To handle the explosive growth in network demand, we added equipment and changed settings almost every day.

In time, the manual approach we had barely managed to maintain reached its limit. Configuration information was managed by individual people, so it slowly became unclear, and configuration errors happened often. We added more reviews to prevent errors, but this made the work process even more complex and time-consuming.

The harder we tried to protect quality, the more people we needed. Because we did not have enough people, the load on each person grew. And because the load grew, more errors happened. It was a true negative cycle.

This experience taught me one thing very clearly. **If our way of working depends on people trying harder, we will someday fail to support IT systems that keep evolving.** What we needed was not small gains in efficiency. We needed to change the very way we worked.

## Before automation, something else had to change

Our first step was not to automate tasks. It was to rethink how we managed configuration information for our systems, because that was the cause of human errors. This information had been spread across many files and kept in the heads of individual engineers. We created a mechanism to centrally manage it, so that everyone could work with the same information.

Then, little by little, things began to change. No one had to search for information anymore. The work depended less on who did it. We could even generate work procedures and parameters from the configuration information.

Changing how we managed information led to a change in the way we worked as a whole.

This is where the ideas behind Exastro were born.

**Design information and configuration information for systems should not be just documents for people to read. They should themselves be information assets that we can use to set up, change, and operate systems.**

And the point of automation is not simply to replace manual work. The goal is to standardize work that has depended on personal experience, build that knowledge into our tools, and reuse it accurately as many times as needed. Based on this idea, we built mechanisms one by one: central management of configuration information, separation of parameters from work procedures, reuse of automation components, and management of task execution.

Around 2015, I came to believe that these problems were not unique to telecom carriers. They were common across the whole IT industry. I wanted to develop our mechanisms into general-purpose tools that anyone could use. That wish led to the development of Exastro, and in 2019 we released Exastro IT Automation as open source.

## And now, the age of AI has arrived

Since the 2020s began, generative AI and Agentic AI have evolved rapidly. When a person states a goal in natural language, AI understands the intent, gathers the information it needs, and thinks about how to achieve the goal. We are entering a time when AI can handle some of the intellectual work that we once thought only humans could do.

As I watched this progress, I saw great potential. At the same time, I noticed something. **The design ideas that Exastro has pursued for many years are, in fact, also critical for AI to perform well.**

Of course, when we started developing Exastro, we did not predict the arrival of Agentic AI as we know it today. But when I review what we built to solve real problems in the field, I can see a consistent philosophy:

To digitize the knowledge in people's heads.

To organize the state and configuration of systems as information that machines can use.

To standardize tasks that depend on individuals, so that they can be reused many times.

And to manage who ran what, when, and how, so that work stays safe and reproducible.

All of these are also essential for AI to understand the state of a system, plan the right tasks, and take action on real systems. Some environments have scattered configuration information, procedures that depend on individuals, and results that cannot be traced. In such environments, no matter how smart AI becomes, we cannot safely trust it with important systems. In fact, the more capable AI becomes, the more important it is to have a foundation that connects its decisions to reliable execution.

When I think about it, our goal was never simply to automate tasks. **It was to convert human knowledge and experience into reusable mechanisms that do not depend on any one person.** With the arrival of AI, I believe this idea has started to mean more than ever.

## Agentic AI for Exastro: Beyond automation

In traditional automation, people basically decided what to run, in what order, and how. So the more we tried to expand automation, the more we needed experts who could design and build automation mechanisms. This became a new barrier to promoting automation.

Agentic AI has the potential to overcome this barrier. For example, an engineer states a goal: "I want to set up a web service on these servers." AI then plans the configuration and tasks, searches for existing automation components, and builds the execution steps. To apply these steps to real systems, Exastro manages configuration information and parameters. After the necessary checks and approvals, it runs the work in a safe and reproducible way.

**People state the intent. AI understands, plans, and decides. Exastro governs and runs.** This is the world we aim for with Agentic AI for Exastro.

However, the key point is not to give AI full control of everything. AI can make excellent decisions, but it can also make mistakes. That is why it is important to use automation components tested in advance, to check what will run and on which targets, and to trace the results.

We combine the flexible judgment of AI with the reliability and reproducibility of the automation that Exastro has built over the years. The two do not compete. They complement each other's strengths. And I believe this combination has even greater potential.

### Making the unknown known, and building knowledge over time

For example, suppose system operations face a failure that no one has experienced before. In the past, a skilled engineer would investigate it, find the cause, and decide how to respond. From now on, AI can support this process.

But what really matters comes after that. People verify the cause and the solution that AI helped find, and store them as reusable knowledge. Then, when the same event happens again, there is no need to treat it as an unknown failure. In this way, we build each experience into the system, so we never have to struggle with the same problem twice.

Unknown events into known events.

Human experience into organizational knowledge.

Organizational knowledge into reusable automation.

As this cycle repeats, system operations become more efficient and more stable with every experience. **We do not only add more automation. We keep expanding the areas that can be automated.** I believe this is the true value of bringing AI and Exastro together.

## Why we are committed to open source

Exastro was developed inside a company. So why do we release it as open source?

I believe that the problems engineers face in supporting IT systems are not something a single company should solve alone. Telecommunications, finance, manufacturing, retail, public services: IT systems are used everywhere in society, and behind them, many engineers struggle every day. Systems keep getting more complex while engineers keep getting fewer. This is a problem for the whole industry, and for society as a whole.

That is why I want the solution to be something that as many people as possible can use freely.

In the age of AI, this feeling has become even stronger. I do not want advanced, AI-driven system setup and operations to belong only to a few large companies or a small group of experts.

I want everyone to be able to try these technologies in their own environments, improve them, and help them grow. And I want engineers around the world to use each other's knowledge and ideas. I believe that this spread of technology and knowledge can change the way the entire IT industry works.

This is the feeling behind our commitment to keeping Exastro open source.

## The courage to change a stable routine

"We have done it this way without any problems. Why should we change?"

I think it is natural for people who are responsible for keeping systems running safely to feel this way. I understand this feeling well myself.

But even if the current way works today, it may not work in the same way in the future. Our own serious work on automation also started because the old way of working reached its limit. If we had changed sooner, how much hardship could we have avoided? I still think about that.

Isn't the same true for using AI?

Of course, adopting AI does not solve every problem. New technology brings new risks, and it needs careful testing. That is why I think we should not discard existing mechanisms. Instead, we should evolve them step by step, using the knowledge and technology we have built. Exastro itself has evolved in this way, and I want it to keep evolving that way.

## Finally, to everyone interested in Exastro

More than 10 years have passed since we started developing Exastro. In that time, the world of IT has changed greatly. AI has arrived with abilities we could not have imagined back then. The work of engineers is also about to change in major ways.

But what I want to achieve through Exastro has not changed. Every time systems become more complex, people must carry that complexity and spend more time and effort. I want to change that world.

Instead, the knowledge and experience we gain are stored in the system and used in the next job. Repetitive work is automated, so engineers can focus on new challenges and on creating new value. And as systems evolve, the tools that support them also become smarter, stronger, and more efficient. That is the world I want to create.

The arrival of AI has not changed the direction of Exastro. Instead, it has created new possibilities to achieve our long-held ideas at an even higher level. I am truly excited about what comes next.

Let's create a future where engineers can work more creatively, more freely, and more smartly. Through Exastro, let's all become "cool engineers" together.
