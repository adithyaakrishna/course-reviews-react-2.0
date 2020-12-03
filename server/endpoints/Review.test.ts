import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import express from "express";

import axios from 'axios';
import { configure } from "../endpoints";
import { Classes, Reviews } from "../dbDefs";

let mongoServer: MongoMemoryServer;
let serverCloseHandle;

const testingPort = 8000;

const testClasses = [
  {
    _id: "oH37S3mJ4eAsktypy",
    classSub: "cs",
    classNum: "2110",
    classTitle: "Object-Oriented Programming and Data Structures",
    classPrereq: [],
    classFull: "cs 2110 object-oriented programming and data structures",
    classSems: ["FA14", "SP15", "SU15", "FA15", "SP16", "SU16", "FA16", "SP17",
      "SU17", "FA17", "SP18", "FA18", "SU18", "SP19", "FA19", "SU19"],
    crossList: ["q75SxmqkTFEfaJwZ3"],
    classProfessors: ["David Gries", "Douglas James", "Siddhartha Chaudhuri",
      "Graeme Bailey", "John Foster", "Ross Tate", "Michael George",
      "Eleanor Birrell", "Adrian Sampson", "Natacha Crooks", "Anne Bracy",
      "Michael Clarkson"],
    classDifficulty: 2.9,
    classRating: null,
    classWorkload: 3,
  },
];

const testReviews = [
  {
    _id: "4Y8k7DnX3PLNdwRPr",
    text: "review text for cs 2110",
    difficulty: 1,
    quality: 4,
    class: "oH37S3mJ4eAsktypy",
    grade: 6,
    date: new Date().toISOString(),
    atten: 0,
    visible: 1,
    reported: 0,
  },
  {
    _id: "4Y8k7DnX3PLNdwRPq",
    text: "review text for cs 2110 number 2",
    difficulty: 1,
    quality: 5,
    class: "oH37S3mJ4eAsktypy",
    grade: 6,
    date: new Date().toISOString(),
    atten: 0,
    visible: 1,
    reported: 0,
  },
];

beforeAll(async () => {
  // get mongoose all set up
  mongoServer = new MongoMemoryServer();
  const mongoUri = await mongoServer.getUri();
  await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

  await Promise.all(
    testClasses.map(async (c) => await (new Classes(c).save())),
  );

  await Promise.all(
    testReviews.map(async (r) => await (new Reviews(r).save())),
  );

  // Set up a mock version of the v2 endpoints to test against
  const app = express();
  serverCloseHandle = app.listen(testingPort, async () => { });
  configure(app);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
  await serverCloseHandle.close();
});

describe('tests', () => {
  it('getReviewsByCourseId - getting review', async () => {
    const res = await axios.post(`http://localhost:${testingPort}/v2/getReviewsByCourseId`, { courseId: "oH37S3mJ4eAsktypy" });
    expect(res.data.result.length).toBe(testReviews.length);

    const classOfReviews = testReviews.map((r) => r.class);
    expect(res.data.result.map((r) => r.class).sort()).toEqual(classOfReviews.sort());
  });

  it("getCourseById - getting cs2110", async () => {
    const res = await axios.post(`http://localhost:${testingPort}/v2/getCourseById`, { courseId: "oH37S3mJ4eAsktypy" });
    expect(res.data.result._id).toBe("oH37S3mJ4eAsktypy");
    expect(res.data.result.classTitle).toBe("Object-Oriented Programming and Data Structures");
  });

  it('getCourseByInfo - getting cs2110', async () => {
    const res = await axios.post(`http://localhost:${testingPort}/v2/getCourseByInfo`, { subject: "cs", number: "2110" });
    expect(res.data.result._id).toBe("oH37S3mJ4eAsktypy");
    expect(res.data.result.classTitle).toBe("Object-Oriented Programming and Data Structures");
  });

  it('getCourseByInfo - demonstrate regex irrelevance', async () => {
    // Will not accept non-numeric:
    const res1 = await axios.post(`http://localhost:${testingPort}/v2/getCourseByInfo`, { subject: "Vainamoinen", number: "ab2187c" }).catch((e) => e);
    expect(res1.message).toBe("Request failed with status code 400");

    // Will not accept non-ascii:
    const res2 = await axios.post(`http://localhost:${testingPort}/v2/getCourseByInfo`, { subject: "向岛维纳默宁", number: "1234" }).catch((e) => e);
    expect(res2.message).toBe("Request failed with status code 400");

    // Both also does not work:
    const res3 = await axios.post(`http://localhost:${testingPort}/v2/getCourseByInfo`, { subject: "向岛维纳默宁", number: "ab2187c" }).catch((e) => e);
    expect(res3.message).toBe("Request failed with status code 400");
  });

  it("getReviewsByCourseId - getting review for a class that does not exist", async () => {
    const res = await axios.post(`http://localhost:${testingPort}/v2/getReviewsByCourseId`, { courseId: "ert" });
    expect(res.data.result).toEqual({ error: 'Malformed Query' });
  });
});
