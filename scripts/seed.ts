import { prisma } from '../src/db/prisma.js';
import { hashPassword } from '../src/services/authService.js';

async function main() {
  console.log('Seeding database...');

  // Clear existing data in reverse relation order
  await prisma.auditLog.deleteMany();
  await prisma.voteAudit.deleteMany();
  await prisma.vote.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.normalizedScore.deleteMany();
  await prisma.score.deleteMany();
  await prisma.judgeAssignment.deleteMany();
  await prisma.criterion.deleteMany();
  await prisma.rubric.deleteMany();
  await prisma.judgeTrack.deleteMany();
  await prisma.judge.deleteMany();
  await prisma.submissionField.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.prize.deleteMany();
  await prisma.track.deleteMany();
  await prisma.event.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const passwordHash = await hashPassword('password');

  const admin = await prisma.user.create({
    data: {
      email: 'admin@test.com',
      passwordHash,
      firstName: 'Admin',
      role: 'ADMIN',
    },
  });

  const organizer = await prisma.user.create({
    data: {
      email: 'organizer@test.com',
      passwordHash,
      firstName: 'Organizer',
      role: 'ORGANIZER',
    },
  });

  const judgeUsers = [];
  for (let i = 1; i <= 5; i++) {
    const judgeUser = await prisma.user.create({
      data: {
        email: `judge${i}@test.com`,
        passwordHash,
        firstName: `Judge ${i}`,
        role: 'JUDGE',
      },
    });
    judgeUsers.push(judgeUser);
  }

  const participants = [];
  for (let i = 1; i <= 10; i++) {
    const participant = await prisma.user.create({
      data: {
        email: `participant${i}@test.com`,
        passwordHash,
        firstName: `Participant ${i}`,
        role: 'PARTICIPANT',
      },
    });
    participants.push(participant);
  }

  // Create event
  const event = await prisma.event.create({
    data: {
      slug: 'test-hackathon-2026',
      name: 'Test Hackathon 2026',
      description: 'A test hackathon for development',
      organizerId: organizer.id,
      status: 'JUDGING',
      registrationStart: new Date('2026-09-01'),
      registrationEnd: new Date('2026-09-10'),
      submissionStart: new Date('2026-09-10'),
      submissionEnd: new Date('2026-09-20'),
      judgingStart: new Date('2026-09-21'),
      judgingEnd: new Date('2026-09-25'),
      votingStart: new Date('2026-09-26'),
      votingEnd: new Date('2026-09-27'),
    },
  });

  // Create event judge assignments for the judges
  const eventJudges = [];
  for (const jUser of judgeUsers) {
    const ej = await prisma.judge.create({
      data: {
        eventId: event.id,
        userId: jUser.id,
        status: 'ACCEPTED',
      },
    });
    eventJudges.push(ej);
  }

  // Create tracks
  const webTrack = await prisma.track.create({
    data: { eventId: event.id, name: 'Web', position: 1 },
  });

  const mobileTrack = await prisma.track.create({
    data: { eventId: event.id, name: 'Mobile', position: 2 },
  });

  const aiTrack = await prisma.track.create({
    data: { eventId: event.id, name: 'AI/ML', position: 3 },
  });

  // Create prizes
  await prisma.prize.create({
    data: {
      eventId: event.id,
      rank: 1,
      title: 'Grand Prize',
      reward: '$500',
    },
  });

  // Create rubric
  const rubric = await prisma.rubric.create({
    data: {
      eventId: event.id,
      name: 'Default Rubric',
      scaleMin: 1,
      scaleMax: 5,
    },
  });

  await prisma.criterion.create({
    data: {
      rubricId: rubric.id,
      name: 'Technical Implementation',
      weight: 0.4,
      position: 1,
    },
  });

  await prisma.criterion.create({
    data: {
      rubricId: rubric.id,
      name: 'Innovation',
      weight: 0.25,
      position: 2,
    },
  });

  await prisma.criterion.create({
    data: {
      rubricId: rubric.id,
      name: 'Usability',
      weight: 0.2,
      position: 3,
    },
  });

  await prisma.criterion.create({
    data: {
      rubricId: rubric.id,
      name: 'Impact',
      weight: 0.15,
      position: 4,
    },
  });

  // Create teams and submissions
  const tracks = [webTrack, mobileTrack, aiTrack];
  const criteria = await prisma.criterion.findMany({ where: { rubricId: rubric.id } });

  for (let i = 0; i < 5; i++) {
    const team = await prisma.team.create({
      data: {
        eventId: event.id,
        name: `Team ${i + 1}`,
        ownerId: participants[i].id,
        status: 'COMPLETE',
      },
    });

    await prisma.teamMember.create({
      data: {
        teamId: team.id,
        userId: participants[i].id,
        role: 'OWNER',
        status: 'ACCEPTED',
      },
    });

    const track = tracks[i % tracks.length];

    const submission = await prisma.submission.create({
      data: {
        eventId: event.id,
        teamId: team.id,
        trackId: track.id,
        name: `Project ${i + 1}`,
        tagline: `A cool project #${i + 1}`,
        description: `This is a detailed description of project ${i + 1}`,
        status: 'ELIGIBLE',
        submittedAt: new Date(),
      },
    });

    // Create judge assignments and scores
    for (let j = 0; j < 3; j++) {
      const judge = eventJudges[j];

      // Ensure judge track link exists (avoid unique constraint duplicate)
      await prisma.judgeTrack.upsert({
        where: {
          judgeId_trackId: {
            judgeId: judge.id,
            trackId: track.id,
          },
        },
        create: {
          judgeId: judge.id,
          trackId: track.id,
        },
        update: {},
      });

      // Create judge assignment
      await prisma.judgeAssignment.create({
        data: {
          judgeId: judge.id,
          submissionId: submission.id,
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      // Create scores
      for (const criterion of criteria) {
        const score = Math.floor(Math.random() * 5) + 1;
        await prisma.score.create({
          data: {
            judgeId: judge.id,
            submissionId: submission.id,
            criterionId: criterion.id,
            score,
            submittedAt: new Date(),
          },
        });
      }
    }
  }

  console.log('✓ Database seeded successfully');
  console.log('\nDevelopment credentials:');
  console.log('Admin: admin@test.com / password');
  console.log('Organizer: organizer@test.com / password');
  console.log('Judge 1: judge1@test.com / password');
  console.log('Participant 1: participant1@test.com / password');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
