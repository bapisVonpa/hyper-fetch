// import { renderHook } from "@testing-library/react-hooks/dom"; // import { Builder, Command } from
"@better-typed/hyper-fetch";

// import { useSubmit } from "use-submit"; // import { startServer, resetMocks, stopServer } from "../../utils/server";
// import { getManyRequest, interceptGetMany } from "../../utils/mocks"; // import { ErrorMockType } from
"../../utils/server/server.constants"; // import { getCurrentState } from "../../utils/utils"; // import {
testFetchInitialState } from "../../shared/fetch.tests";

// const dump = getManyRequest.dump();

// let builder = new Builder<ErrorMockType>({ baseUrl: "" }); // let command = new Command(builder, dump.commandOptions,
dump);

// const renderGetManyHook = () => renderHook(() => useSubmit(command, { dependencyTracking: false }));

// describe("[Basic] UseSubmit hook", () => { // beforeAll(() => { // startServer(); // });

// afterEach(() => { // resetMocks(); // });

// afterAll(() => { // stopServer(); // });

// beforeEach(async () => { // builder.clear(); // builder = new Builder<ErrorMockType>({ baseUrl: "" }); // command =
new Command(builder, dump.commandOptions, dump); // });

// it("should initialize without submitting state", async () => { // interceptGetMany(200);

// const responseOne = renderGetManyHook(); // const responseTwo = renderGetManyHook();

// testFetchInitialState(responseOne); // testFetchInitialState(responseTwo);

// expect(getCurrentState(responseOne).submitting).toBe(false); //
expect(getCurrentState(responseTwo).submitting).toBe(false); // }); // });