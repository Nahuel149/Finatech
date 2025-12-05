const { Router } = require('express');
const { geocode } = require('../controllers/location.controller');

const router = Router();

router.get('/geocode', geocode);

module.exports = router;
