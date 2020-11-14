const jwt = require('jsonwebtoken')
const Connection = require('../db/mysql')
const { OAuth2Client } = require('google-auth-library')

generateAuthToken = async (userid, callback) => {
  console.log('token id ' + userid)

  let token = jwt.sign({ id: userid }, process.env.JWT_SECRET)

  Connection.query(`INSERT INTO tokens (user_id, token) VALUES (${userid}, '${token}')`, (error, results, fields) => {
    if (error) throw error;
    callback(token)
  })
}

stalker = async (userid, victimid, callback) => {
  Connection.query(`INSERT INTO stalkers (user_id, stalker_id) VALUES (${victimid}, ${userid})`, (error, results, fields) => {
    if (error) throw error;
    
    Connection.query(`UPDATE users SET stalkers_count = stalkers_count + 1 WHERE id = ${victimid}`, (error, results, fields) => {
      if (error) throw error;
      return callback();
    })

  })
}

createUser = async (fname, lname, email, profile_pic_url, callback) => {
  Connection.query(`
    INSERT INTO users (fname, lname, email, profile_pic_url) 
    VALUES (
      '${fname}',
      '${lname}',
      '${email}',
      '${profile_pic_url}'
    )`, (error, results, fields) => {
    if (error) {
      console.log(error)
      return callback(false);
    }
    return callback(true);
  })
}

fetchUserDetails = async (email, callback) => {
  Connection.query(`SELECT * FROM users WHERE email = '${email}'`, (error, results, fields) => {
    if (error) throw error;
    return callback(results[0])
  })
}

addContacts = async (id, phone, ig_link) => {
  Connection.query(`SELECT * FROM contacts WHERE user_id = ${id}`, (error, results, fields) => {
    if (error) throw error;
    console.log(results.length)
    switch (results.length) {
      case 0:
        // if no contacts exist add new ones
        Connection.query(`
        INSERT INTO contacts (
          user_id, 
          phone, 
          instagram_link) 
          VALUES (
            ${id},
            '${phone}',
            '${ig_link}'
          )`, (error, results, fields) => {
          if (error) throw error;
          return;
        })
        break;
    
      default:
        Connection.query(`UPDATE contacts SET 
        user_id = ${id}, 
        phone = '${phone}', 
        instagram_link = '${ig_link}' WHERE user_id = ${id}`, (error, results, fields) => {
          if (error) throw error;
          return;
        })

        break;
    }
  })
}

fetchUserId = async (email, callback) => {
  Connection.query(`SELECT * FROM users WHERE email = '${email}'`, (error, results, fields) => {
    if (error) throw error;
    return callback(results[0].id)
  })
}

// check whether the used token is legit
confirmToken = async (token, callback) => {
  const client = new OAuth2Client(process.env.CLIENT_ID)

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.CLIENT_ID
    })

    const payload = ticket.getPayload()
    const userid = payload['sub']

  } catch (error) {
    callback(false)
  }

  console.log('Token confirmed')
  return callback(true);
}

module.exports = {
  createUser,
  generateAuthToken,
  fetchUserDetails,
  fetchUserId,
  stalker,
  confirmToken,
  addContacts
}