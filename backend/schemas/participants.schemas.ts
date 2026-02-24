import z from "zod";

const participantSchema = z.object({
  firstName: z.string().min(3),
  lastName: z.string().min(3),
  participantType: z.enum(["IIIT-H", "External"]),
  email: z.email(),
  mobile: z.string().min(10),
  orgName: z.string().min(3),
  password: z.string().min(3)
});

export default participantSchema;