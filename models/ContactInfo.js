import mongoose from "mongoose";

const PhoneSchema = new mongoose.Schema({
  number: { type: String, default: "" },
  label:  { type: String, default: "" },
}, { _id: false });

const EmailSchema = new mongoose.Schema({
  address: { type: String, default: "" },
  label:   { type: String, default: "" },
}, { _id: false });

const DirectionSchema = new mongoose.Schema({
  label: { type: String, default: "" },
  desc:  { type: String, default: "" },
}, { _id: false });

const ContactInfoSchema = new mongoose.Schema({
  // Visit Us
  addressLine1: { type: String, default: "Savar, Dhaka" },
  addressLine2: { type: String, default: "Bangladesh" },
  addressNote:  { type: String, default: "Approx. 1 hr from Dhaka city" },

  // Call Us
  phones:     { type: [PhoneSchema], default: [{ number: "+880 1XXX-XXXXXX", label: "" }] },
  phoneHours: { type: String, default: "Daily 8:00 AM – 10:00 PM" },

  // Email Us
  emails:    { type: [EmailSchema], default: [{ address: "hello@ambernivaas.com", label: "" }] },
  emailNote: { type: String, default: "We reply within 24 hours" },

  // Hours
  checkInTime:    { type: String, default: "2:00 PM" },
  checkOutTime:   { type: String, default: "11:00 AM" },
  frontDeskHours: { type: String, default: "Front desk open 24 / 7" },

  // Quick-contact sidebar (beside the form)
  reservationPhone: { type: String, default: "+880 1XXX-XXXXXX" },
  eventsPhone:      { type: String, default: "+880 1XXX-XXXXXX" },
  sidebarEmail:     { type: String, default: "hello@ambernivaas.com" },

  // How to find us
  directions: {
    type: [DirectionSchema],
    default: [
      { label: "From Dhaka City",  desc: "Approximately 1 hour via the Dhaka–Aricha Highway. Our resort is clearly signposted from the main road." },
      { label: "By Private Car",   desc: "Drive to Savar and follow the signs to Amber Nivaas. Free secure parking is available on arrival." },
      { label: "Airport Transfer", desc: "We offer private pick-up from Hazrat Shahjalal International Airport. Contact us to arrange." },
    ],
  },

  // Map
  mapEmbedMode: { type: String, enum: ["official", "unofficial"], default: "unofficial" },
  mapEmbedUrl:  { type: String, default: "" },
  mapLat:       { type: Number, default: 23.9 },
  mapLng:       { type: Number, default: 90.2 },

  // Contact form email recipient
  contactFormEmail: { type: String, default: "" },

  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.ContactInfo || mongoose.model("ContactInfo", ContactInfoSchema);
