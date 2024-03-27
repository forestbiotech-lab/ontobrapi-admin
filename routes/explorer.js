const router = require('express').Router();
//Only receivable routes limited by gatekeeper



router.get("/staging/:datasetId", async (req, res) => {
    res.render("explorer/class" )
})

router.get("/ontobrapi/:datasetId", (req, res) => {
    res.render("explorer/class" )
})


module.exports = router;
