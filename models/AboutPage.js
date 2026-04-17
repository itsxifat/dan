import mongoose from "mongoose";

const AboutPageSchema = new mongoose.Schema({
  chairmanName:         { type: String, default: "Md. Abdur Rahman Dhali" },
  chairmanTitle:        { type: String, default: "Chairman" },
  chairmanOrganization: { type: String, default: "Dhali's Amber Nivaas Resort" },
  chairmanImage:        { type: String, default: "" },
  chairmanQuote:        { type: String, default: "When we built Amber Nivaas, we did not simply wish to build a resort. We wished to create a place where a family could breathe freely, rest deeply, and experience genuine warmth — all within the bounds of our faith and values." },
  chairmanMessagePara1: { type: String, default: "Every corner of this resort carries a promise — that you will be welcomed with sincerity, served with care, and surrounded by the natural beauty Allah has blessed this land with. We are honoured to host you, and we pray your time here brings you peace and joy." },
  chairmanMessagePara2: { type: String, default: "Our commitment to halal standards, family values, and heartfelt service is not a policy — it is who we are. On behalf of the entire Dhali family, I welcome you home." },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.AboutPage || mongoose.model("AboutPage", AboutPageSchema);
