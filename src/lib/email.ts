import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.naver.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.NAVER_USER,
    pass: process.env.NAVER_PASSWORD,
  },
});

export async function sendSignupRequestEmail({
  adminEmail,
  applicantName,
  applicantUsername,
  applicantEmail,
  approveUrl,
}: {
  adminEmail: string;
  applicantName: string;
  applicantUsername: string;
  applicantEmail: string;
  approveUrl: string;
}) {
  await transporter.sendMail({
    from: `"DesignBoard" <${process.env.NAVER_USER}>`,
    to: adminEmail,
    subject: `[DesignBoard] 새 가입 신청 — ${applicantName}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#f7f9fc;border-radius:12px;">
        <h2 style="color:#191F28;font-size:18px;margin-bottom:4px;">새 가입 신청이 들어왔습니다</h2>
        <p style="color:#6B7685;font-size:14px;margin-bottom:24px;">아래 정보를 확인하고 승인 여부를 결정해주세요.</p>
        <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">
          <tr><td style="padding:12px 16px;color:#A0AAB4;font-size:13px;width:80px;">이름</td><td style="padding:12px 16px;color:#191F28;font-size:14px;font-weight:600;">${applicantName}</td></tr>
          <tr style="border-top:1px solid #e2e8f0;"><td style="padding:12px 16px;color:#A0AAB4;font-size:13px;">아이디</td><td style="padding:12px 16px;color:#191F28;font-size:14px;">@${applicantUsername}</td></tr>
          <tr style="border-top:1px solid #e2e8f0;"><td style="padding:12px 16px;color:#A0AAB4;font-size:13px;">이메일</td><td style="padding:12px 16px;color:#191F28;font-size:14px;">${applicantEmail}</td></tr>
        </table>
        <a href="${approveUrl}" style="display:inline-block;margin-top:24px;padding:12px 28px;background:#3366FF;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">
          가입 승인하기
        </a>
        <p style="margin-top:16px;color:#A0AAB4;font-size:12px;">
          승인하지 않으려면 이 메일을 무시하세요.<br/>
          또는 <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin" style="color:#3366FF;">관리자 페이지</a>에서 관리할 수 있습니다.
        </p>
      </div>
    `,
  });
}
