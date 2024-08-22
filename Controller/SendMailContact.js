const nodemailer = require ('nodemailer')

const Email = (options)=>{
    let transpoter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SENDER_EMAIL_ADDRESS ,
          pass: process.env.PASSWORD
        },
      
    })
    transpoter.sendMail(options,(err,info)=>{
        if (err) {
            console.log(err);
            return;
        }
    });
}
//send email


const EmailSender = ({name,subject,email,phone,message})=>{
    const options ={ 
        from: `ONRWEB <${process.env.SENDER_EMAIL_ADDRESS}>`,
        to : process.env.SEND_TO,
        subject: `New message from ONRWEB : ${subject}`,
        html : `
        <div>

        <p>Hello </p>
        <p>You got a new message from <strong>${name}</strong></p>
        <p>Email :
            <span style="color: #000000;"> 
                <span style="text-decoration: underline; color: #3598db;">
                    ${email}
                </span>
            </span>
        </p>
        <p>Phone :<strong>&nbsp;</strong>&nbsp;<strong>${phone}</strong></p>
        <p style="padding: 12px; border-left: 4px solid #d0d0d0; font-style: italic;">${message}</p>
        </div>`
    };
    Email(options)
}

module.exports = EmailSender