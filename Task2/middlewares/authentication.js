async function authenticate(req, res, next) {
    const bearerHeader = await req.headers["authorization"];
    console.log(bearerHeader);
    if (bearerHeader != undefined) {
      const token = bearerHeader;
  
      jwt.verify(token, key, (err, authData) => {
        if (err) {
          console.log(err);
        } else {
          res.send({
            message: "Verified",
            data: authData,
          });
        }
      });
      next();
    } else {
      res.send(`Inavlid Token`);
    }
  }

  export {authenticate}