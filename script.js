import http from "k6/http";
import { check, group, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

const api_key = "live_BjZjwnEj8RrwIYKxrk3cU24riDljHcNZ2Hb1cQPFXeZvhBZud4CtkteHpyirKRZ3"

export let options = {
    thresholds: {
        "http_req_duration": ["p(90)<40000"],
        "http_req_duration{staticAsset:yes}": ["p(90)<40000"],
        "check_failure_rate": ["rate<0.5"]
    },
    scenarios: {
        frontPageAndStaticAssets: {
            executor: 'constant-vus',
            vus: 20,
            duration: '5s',
            exec: 'loadFrontPageAndStaticAssets'
        },
        catImageLoad: {
            executor: 'constant-vus',
            vus: 20,
            duration: '5s',
            exec: 'loadCatImages'
        },
        catBreedsLoad: {
            executor: 'constant-vus',
            vus: 20,
            duration: '5s',
            exec: 'loadCatBreeds'
        }
    }
};

let checkFailureRate = new Rate("check_failure_rate");
let timeToFirstByte = new Trend("time_to_first_byte", true);

export function loadFrontPageAndStaticAssets() {
    frontPage();
    loadStaticAssets();
    sleep(10);
    sleep(10);
}

export function loadCatImages() {
    load10CatImages();
    loadCatImagesWithComplexQuery()
    sleep(10);
    sleep(10);
}

export function loadCatBreeds() {
    load10CatBreeds()
    loadCatBreedsWithImageByTerm()
    sleep(10);
    sleep(10);
}

function frontPage() {
    let res = http.get("https://developers.thecatapi.com/");
    let ttfb = res.timings.waiting;
    timeToFirstByte.add(ttfb);
    checkFailureRate.add(!check(res, {
        "Homepage loaded correctly": (r) => r.status === 200,
    }));
}

function loadStaticAssets() {
    let reqs = [
        ["GET", "https://developers.thecatapi.com/static/js/2.26164cab.chunk.js", null, { tags: { staticAsset: "yes" } }],
        ["GET", "https://developers.thecatapi.com/static/js/main.a27190ab.chunk.js", null, { tags: { staticAsset: "yes" } }]
    ];
    let res = http.batch(reqs);
    res.forEach((response) => {
        check(response, {
            "Static asset loaded correctly": (r) => r.status === 200,
        });
    });
}

function load10CatImages() {
    let res = http.get("https://api.thecatapi.com/v1/images/search?limit=20", { headers: {
        'x-api-key': api_key
    } });
    let ttfb = res.timings.waiting;
    timeToFirstByte.add(ttfb);
    checkFailureRate.add(!check(res, {
        "cat images loaded correctly": (r) => r.status === 200,
    }));
}

function loadCatImagesWithComplexQuery() {
    let res = http.get("https://api.thecatapi.com/v1/images/search?size=med&mime_types=jpg&format=json&has_breeds=true&order=RANDOM&page=0&limit=1", { headers: {
        'x-api-key': api_key
    } });
    let ttfb = res.timings.waiting;
    timeToFirstByte.add(ttfb);
    checkFailureRate.add(!check(res, {
        "cat images with complext query loaded correctly": (r) => r.status === 200,
    }));
}

function load10CatBreeds() {
    let res = http.get("https://api.thecatapi.com/v1/breeds?limit=10&page=0", { headers: {
        'x-api-key': api_key
    } });
    let ttfb = res.timings.waiting;
    timeToFirstByte.add(ttfb);
    checkFailureRate.add(!check(res, {
        "10 cat breeds loaded correctly": (r) => r.status === 200,
    }));
}

function loadCatBreedsWithImageByTerm() {
    let res = http.get("https://api.thecatapi.com/v1/breeds/search?q=air&attach_image=1", { headers: {
        'x-api-key': api_key
    } });
    let ttfb = res.timings.waiting;
    timeToFirstByte.add(ttfb);
    checkFailureRate.add(!check(res, {
        "10 cat breeds loaded correctly": (r) => r.status === 200,
    }));

}