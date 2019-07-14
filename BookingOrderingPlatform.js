let fs = require("fs");
let bookings = JSON.parse(fs.readFileSync("bookingordering.json"));
let locationsMap = new Map();
let startCount = new Map();
let endCount = new Map();
let reorderedSeq = [];
let nextNearestLocation;
let totalCount = 0;
let relocationCount = 0;

const countLocations = (bookingOrder) => {
    startCount.set(bookingOrder.start, startCount.has(bookingOrder.start) ? startCount.get(bookingOrder.start) + 1 : 1);
    endCount.set(bookingOrder.end, endCount.has(bookingOrder.end) ? endCount.get(bookingOrder.end) + 1 : 1);
};

const getFirstLocations = (startCount) => {
    for (let key of startCount.keys()) {
        let endCountValue = endCount.has(key) ? endCount.get(key) : 0;
        if (startCount.get(key) > endCountValue) {
            if (Array.isArray(locationsMap.get(key)))
                return locationsMap.get(key).filter(location => location.visited === false)[0];
            else
                return locationsMap.get(key);
        }
    }
};

const getNextNearestLocation = (checkMap, currLocation) => {
    let nextAvailableLocations = checkMap.get(currLocation.end);

    if (Array.isArray(nextAvailableLocations)) {
        nextAvailableLocations = nextAvailableLocations.filter(nextLocation => !nextLocation.visited);
        let nextAvailableSimilarLocations = nextAvailableLocations.filter(nextLocation => nextLocation.start === nextLocation.end);
        return nextAvailableSimilarLocations.length === 0 ? nextAvailableLocations[0] : nextAvailableSimilarLocations[0];
    }
    else {
        return nextAvailableLocations;
    }
};

bookings.map(bookingOrder => {
    let existingOrder = [];
    bookingOrder['visited'] = false;
    if (locationsMap.has(bookingOrder.start)) {
        existingOrder = locationsMap.get(bookingOrder.start);
        existingOrder = Array.isArray(existingOrder) ? existingOrder : [existingOrder];
        existingOrder.push(bookingOrder);
        locationsMap.set(bookingOrder.start, existingOrder);
    }
    else {
        locationsMap.set(bookingOrder.start, bookingOrder);
    }
    totalCount++;
    countLocations(bookingOrder);
});
while (bookings.length > 0) {
    if (!nextNearestLocation) {
        if (bookings.length < totalCount) {
            relocationCount++;
            console.log('Relocating ...');
        }
        nextNearestLocation = getFirstLocations(startCount);
    }
    console.log('Moving from ', nextNearestLocation.start, nextNearestLocation.end);
    bookings.splice(bookings.indexOf(nextNearestLocation), 1);
    nextNearestLocation['visited'] = true;
    startCount.set(nextNearestLocation.start, startCount.get(nextNearestLocation.start) - 1);
    endCount.set(nextNearestLocation.end, endCount.get(nextNearestLocation.end) - 1);
    reorderedSeq.push(nextNearestLocation.id);
    nextNearestLocation = getNextNearestLocation(locationsMap, nextNearestLocation);
}


fs.writeFile('output.json', JSON.stringify(reorderedSeq), 'utf8', () => {
    console.log(`Reordered Bookings with ${relocationCount} relocations. Please Check output.json`);
});


