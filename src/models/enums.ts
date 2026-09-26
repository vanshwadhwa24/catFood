export const Role = {
  ADMIN: 'ADMIN',
  ORGANIZER: 'ORGANIZER',
  JUDGE: 'JUDGE',
  PARTICIPANT: 'PARTICIPANT',
  VISITOR: 'VISITOR',
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const EventStatus = {
  DRAFT: 'DRAFT',
  REGISTRATION_OPEN: 'REGISTRATION_OPEN',
  REGISTRATION_CLOSED: 'REGISTRATION_CLOSED',
  SUBMISSION_OPEN: 'SUBMISSION_OPEN',
  SUBMISSION_CLOSED: 'SUBMISSION_CLOSED',
  ELIGIBILITY_REVIEW: 'ELIGIBILITY_REVIEW',
  JUDGING: 'JUDGING',
  JUDGING_COMPLETE: 'JUDGING_COMPLETE',
  VOTING: 'VOTING',
  VOTING_CLOSED: 'VOTING_CLOSED',
  RESULTS: 'RESULTS',
  CERTIFICATES: 'CERTIFICATES',
  ARCHIVED: 'ARCHIVED',
} as const;
export type EventStatus = (typeof EventStatus)[keyof typeof EventStatus];

export const TeamStatus = {
  FORMING: 'FORMING',
  COMPLETE: 'COMPLETE',
  DISBANDED: 'DISBANDED',
} as const;
export type TeamStatus = (typeof TeamStatus)[keyof typeof TeamStatus];

export const TeamMemberRole = {
  OWNER: 'OWNER',
  MEMBER: 'MEMBER',
} as const;
export type TeamMemberRole = (typeof TeamMemberRole)[keyof typeof TeamMemberRole];

export const MemberStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  DECLINED: 'DECLINED',
  REMOVED: 'REMOVED',
} as const;
export type MemberStatus = (typeof MemberStatus)[keyof typeof MemberStatus];

export const SubmissionStatus = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  DISQUALIFIED: 'DISQUALIFIED',
  ELIGIBLE: 'ELIGIBLE',
} as const;
export type SubmissionStatus = (typeof SubmissionStatus)[keyof typeof SubmissionStatus];

export const JudgeStatus = {
  INVITED: 'INVITED',
  ACCEPTED: 'ACCEPTED',
  DECLINED: 'DECLINED',
  COMPLETED: 'COMPLETED',
} as const;
export type JudgeStatus = (typeof JudgeStatus)[keyof typeof JudgeStatus];

export const AssignmentStatus = {
  PENDING: 'PENDING',
  STARTED: 'STARTED',
  COMPLETED: 'COMPLETED',
} as const;
export type AssignmentStatus = (typeof AssignmentStatus)[keyof typeof AssignmentStatus];

export const VotingMode = {
  OPEN_LINK: 'OPEN_LINK',
  EMAIL_GATED: 'EMAIL_GATED',
  AUTHENTICATED: 'AUTHENTICATED',
} as const;
export type VotingMode = (typeof VotingMode)[keyof typeof VotingMode];
