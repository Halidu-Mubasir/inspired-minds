/** Contact details and links used across the site. Change them here, not in components. */
export const SITE = {
  lmsUrl: process.env.NEXT_PUBLIC_LMS_URL ?? "http://localhost:3000",
  phones: [
    { display: "0550 583 636", tel: "+233550583636" },
    { display: "0506 402 626", tel: "+233506402626" },
  ],
  /** WhatsApp chats open on the first number. */
  whatsapp: "233550583636",
  email: "inspiredmindst@gmail.com",
  location: "Tamale, Northern Region, Ghana",
};
