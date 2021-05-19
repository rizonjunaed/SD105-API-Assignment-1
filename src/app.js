const baseAPIaddress = "https://api.winnipegtransit.com/v3/";
const keyForAPI = "eajOnJdPQAp9FybCK5Z5";
const busStops = "stops.json?street=";
const streetList = document.querySelector(".streets");
const tableBody = document.querySelector("tbody");
const form = document.querySelector("form");

const streetSearch = async function (string) {
    const response = await fetch(
        `${baseAPIaddress}streets.json?api-key=${keyForAPI}&name=${string}`
    );
    const data = await response.json();
    return data.streets;
};

const busStation = async function (streetKey) {
    const response = await fetch(
        `${baseAPIaddress}stops.json?api-key=${keyForAPI}&street=${streetKey}`
    );
    const data = await response.json();
    return data;
};

const busRouteData = async function (stopKey) {
    const response = await fetch(
        `${baseAPIaddress}stops/${stopKey}/schedule.json?api-key=${keyForAPI}&max-results-per-route=2`
    );
    const data = await response.json();
    return data["stop-schedule"]["route-schedules"];
};

const streetLink = function (street) {
    if (street.leg)
        return `<a href="#" data-street-key="${street.key}">${street.name} ${street.leg}</a>`;
    else
        return `<a href="#" data-street-key="${street.key}">${street.name}</a>`;
};

const allStreetList = function (streets) {
    streetList.innerHTML = "";
    for (let street of streets) {
        streetList.innerHTML += streetLink(street);
    }
    if (streets.length == 0) streetList.innerHTML = "No Streets found";
};

const ObjectData = async function () {
    for (let stop in dataObject.stops) {
        const routes = await busRouteData(stop);
        for (let route of routes) {
            dataObject.stops[stop].routes[route.route.key] = [];
            for (let i = 0; i < 2; i++) {
                if (route["scheduled-stops"][i].times.arrival.scheduled) {
                    dataObject.stops[stop].routes[route.route.key].push(
                        route["scheduled-stops"][i].times.arrival.scheduled
                    );
                }
            }
        }
    }

    return dataObject;
};

form.addEventListener("submit", (e) => {
    e.preventDefault();
    const searchString = e.target[0].value;

    if (searchString) {
        streetSearch(searchString)
            .then((streets) => {
                allStreetList(streets);
            })
            .catch((err) => {
                console.log("Something went wrong:");
                console.log(err);
            });
    }
});

streetList.addEventListener("click", (e) => {
    if (e.target.tagName === "A") {
        const streetKey = e.target.dataset.streetKey;
        document.getElementById("street-name").innerHTML =
            "Displaying results for " + e.target.outerText;
        populateBusStops(streetKey);
    }
});

const populateBusStops = function (streetKey) {
    fetch(`${baseAPIaddress}stops.json?api-key=${keyForAPI}&street=${streetKey}`)
        .then((stopsRespose) => stopsRespose.json())
        .then((stopsJson) => pushDatas(stopsJson));
};

const stopSchedules = (stopKeys) => {
    let promises = [];
    for (let key of stopKeys.stops) {
        let fetches = fetch(
            `${baseAPIaddress}stops/${key.key}/schedule.json?api-key=${keyForAPI}&max-results-per-route=2`
        ).then((data) => data.json());
        promises.push(fetches);
    }

    return promises;
};

const pushDatas = (data) => {
    tableBody.innerHTML = "";
    Promise.all(stopSchedules(data)).then((response) => {
        let str = ``;

        response.forEach((e) => {
            if (e["stop-schedule"]["route-schedules"].length > 0) {
                for (let route of e["stop-schedule"]["route-schedules"]) {
                    for (let bus of route["scheduled-stops"]) {
                        let busTime = bus.times.departure.scheduled;
                        const appointment = new Date(
                            busTime
                        ).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "numeric",
                        });

                        str += `
                          <tr>
                            <td>${e["stop-schedule"].stop.street.name}</td>
                            <td>${e["stop-schedule"].stop["cross-street"].name}</td>
                            <td>${e["stop-schedule"].stop.direction}</td>`;

                        str += `<td>${route.route.key}</td>`;
                        str += `<td>${appointment}</td></tr>`;
                    }
                }
            }
        });

        tableBody.innerHTML = str;
    });
};
