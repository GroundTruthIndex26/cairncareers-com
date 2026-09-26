---
name: explain-ai-exposure-score
description: "Explain a CairnCareers AI-exposure score (0 to 100) to a student: what it measures, how it is calculated from O*NET tasks and the Eloundou et al. (2024) framework, what the outlook arrow means, and what it cannot tell them. Use when someone asks what their CairnCareers exposure score means, why two careers scored differently, or whether a score means a job will disappear."
---

# Explain a CairnCareers AI-exposure score

The authoritative version of everything below is the methodology page, `https://cairncareers.com/methodology` (Markdown at `https://cairncareers.com/methodology.md`). Read it first if you can; if it disagrees with this skill, the page wins. Link it in your answer.

## What the score measures

How much of an occupation's current work today's AI can do, on a 0 to 100 scale. It measures task exposure. It is not a prediction that a job will disappear, and it is not a prediction about the person.

## How it is calculated

1. Each career path is matched to a standardized occupation in O\*NET, the U.S. Department of Labor's occupational database (https://www.onetonline.org/). The person sees the occupation name and how close the match is.
2. Each task in that occupation gets an exposure value from the framework in Eloundou et al. (2024), "GPTs are GPTs," *Science* 384(6702), 1306 to 1308 (https://www.science.org/doi/10.1126/science.adj0998):
   - **Minimal**, 0: today's AI cannot meaningfully do the task.
   - **Partial**, 0.5: AI can do it with the right software or tools.
   - **Full**, 1.0: AI can already do it on its own.
3. Each value is weighted by that task's share of the work, the weighted values are averaged, and the result is scaled to 100.

Worked example from the methodology page: half the work is a Full task, a quarter is Partial, a quarter is Minimal. (0.5 x 1.0) + (0.25 x 0.5) + (0.25 x 0) = 0.625, which is about 63.

This is why two similar-sounding careers can score very differently: the score follows the mix of tasks inside the occupation, not the job title.

## What never moves the score

Salary, job growth, location, network and portfolio are shown beside the score and cannot change it by a single point. Pay and growth come from the U.S. Bureau of Labor Statistics (https://www.bls.gov/ooh/ and https://www.bls.gov/oes/) and are context only.

## The outlook

Next to the score is a direction: rising, steady, or already at the ceiling. It is anchored to METR's finding that the length of task AI can complete with 50 percent reliability has been doubling roughly every seven months (https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/). CairnCareers deliberately gives no single percentage for a future year, because nobody can honestly claim that precision.

## What the score cannot see

The person's employer, skill, judgment and relationships. Present the score as an informed starting point for comparing paths, not as career, financial or legal advice.

## How to answer

- Say what the number measures in one sentence before you interpret it.
- If the person is worried about a high score, point to the tasks that scored Minimal and to what the score cannot see, not to reassurance you cannot source.
- Every figure you give needs its source link: the methodology page, or one of the sources above.
- Do not invent a score for an occupation. Scores come from the person's own CairnCareers dashboard.
