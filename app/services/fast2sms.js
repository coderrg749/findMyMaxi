const fast2sms = require('fast-two-sms')
// async function sendMobileOtp(otp,mobile){
//     console.log("inside otpf",otp,mobile);
//     try{
//         if(mobile&&otp){
//             var options ={
//                 authorization:"x6jeByplaJskCMIUniumY4SR08tTr53w1ZzoKfW7g9cvD2XPOhASiabdF38MKhTg10fsZ2G5UyBlmOXx",
//                 message:`Heres Otp ${otp}`,
//                 numbers:[mobile]
//             }
//     console.log(options,"options")
//     const response = await fast2sms.sendMessage(options)
//     console.log("running") // this code isnt't running
//       console.log(response,"this is response")
//             return true;
//         }
//     }catch(err){
//    throw new Error(err)
//     }
// }
// module.exports = sendMobileOtp;

async function sendMobileOtp(otp, mobile) {
    console.log("inside otpf", otp, mobile);
    try {
        if (mobile) {
            const response = await fast2sms.sendMessage({authorization:process.env.F2S_SECRET,message:otp,numbers:[mobile]});
            console.log(response,"this is respose and type of response is ",typeof(response));
            if (response.return) {
                console.log("Message sent successfully:", response.message);
                return true;
            } else {
                console.log("Message sending failed:", response.message);
                return false;
            }
        }
    } catch (err) {
        console.error("Error sending OTP:", err);
        throw new Error(err);
    }
}

module.exports = sendMobileOtp;