#!/usr/bin/env bash
# End-to-end smoke test for the Zapravka backend.
BASE="${BASE:-http://localhost:5000}"
pass=0; fail=0
ok() { echo "  ✅ $1"; pass=$((pass+1)); }
no() { echo "  ❌ $1 -- ${2:0:200}"; fail=$((fail+1)); }

wrap() { echo "{\"serviceName\":\"test\",\"clientId\":\"test-client\",\"userId\":\"123\",\"requestId\":\"r\",\"data\":$1}"; }
post() { curl -s -m 15 -X POST "$BASE$1" -H "Content-Type: application/json" -d "$(wrap "$2")"; }

# field <json-on-stdin> via dotted path, e.g. "data.access_token" or "data.0.id"
field() {
  python -c '
import sys, json
try:
    d = json.load(sys.stdin)
    for k in sys.argv[1].split("."):
        if k == "": continue
        d = d[int(k)] if k.isdigit() else d[k]
    print(d)
except Exception:
    print("")
' "$1"
}

echo "== health =="
curl -s -m 10 "$BASE/health" | grep -q '"status":"ok"' && ok "health" || no "health" "no ok"

echo "== admin login (super-admin) =="
R=$(post /api/v1/auth/login '{"phoneNumber":"998901112233","password":"admin123"}')
ATOKEN=$(echo "$R" | field "data.access_token")
[ -n "$ATOKEN" ] && ok "super-admin login" || no "super-admin login" "$R"

echo "== dashboard =="
R=$(post /api/v1/station/dashboard "{\"token\":\"$ATOKEN\"}")
echo "$R" | grep -q 'allStationsCount' && ok "dashboard counts" || no "dashboard" "$R"

echo "== getStations (admin flat + client nested) =="
R=$(post /api/v1/station/getStations "{\"token\":\"$ATOKEN\",\"latitude\":0,\"longitude\":0,\"limit\":20,\"page\":1}")
{ echo "$R" | grep -q '"gasCategory"' && echo "$R" | grep -q '"gasCategories"'; } && ok "getStations has BOTH gasCategory + gasCategories" || no "getStations shape" "$R"
echo "$R" | grep -q 'http://localhost:5000/api/v1/files/' ; FP=$?

echo "== getStations (geo) =="
R=$(post /api/v1/station/getStations "{\"token\":\"$ATOKEN\",\"latitude\":41.31,\"longitude\":69.28,\"limit\":5,\"page\":1}")
echo "$R" | grep -q '"location"' && ok "getStations geo + location" || no "getStations geo" "$R"

echo "== gasCategories =="
R=$(post /api/v1/gasCategory/getGasCategories "{\"token\":\"$ATOKEN\",\"name_uz\":\"\",\"name_ru\":\"\",\"limit\":100,\"page\":1}")
echo "$R" | grep -q 'name_uz' && ok "gasCategories" || no "gasCategories" "$R"

echo "== stationAdmin getAll (double-nested data.data[]) =="
R=$(post /api/v1/stationAdmin/getAll "{\"token\":\"$ATOKEN\",\"name\":\"\"}")
echo "$R" | python -c 'import sys,json;d=json.load(sys.stdin);assert isinstance(d["data"]["data"],list)' >/dev/null 2>&1 && ok "stationAdmin getAll data.data[]" || no "stationAdmin getAll" "$R"

echo "== driver register (dev OTP) =="
PH="99890$(( (RANDOM % 9000000) + 1000000 ))"
R=$(post /api/v1/auth/register "{\"phoneNumber\":\"$PH\",\"password\":\"secret123\",\"firstName\":\"Test\",\"lastName\":\"Driver\"}")
OTP=$(echo "$R" | field "data.otp")
[ -n "$OTP" ] && ok "register returns otp ($OTP)" || no "register" "$R"

echo "== verify OTP -> tokens =="
R=$(post /api/v1/auth/verifyOtp "{\"phoneNumber\":\"$PH\",\"otp\":\"$OTP\"}")
UTOKEN=$(echo "$R" | field "data.access_token")
[ -n "$UTOKEN" ] && ok "verifyOtp -> tokens" || no "verifyOtp" "$R"

echo "== me =="
R=$(post /api/v1/auth/me "{\"token\":\"$UTOKEN\"}")
echo "$R" | grep -q "$PH" && ok "me returns profile" || no "me" "$R"

echo "== update profile =="
R=$(post /api/v1/profile/updateProfile "{\"token\":\"$UTOKEN\",\"userId\":\"x\",\"firstName\":\"Test2\",\"lastName\":\"Driver2\"}")
echo "$R" | grep -q 'Test2' && ok "updateProfile" || no "updateProfile" "$R"

echo "== create car (_id) =="
R=$(post /api/v1/car/createCars "{\"token\":\"$UTOKEN\",\"carBrand\":\"Chevrolet\",\"color\":\"white\",\"plateNumber\":\"01A001AZ\",\"engineType\":\"petrol\"}")
CARID=$(echo "$R" | field "data._id")
[ -n "$CARID" ] && ok "createCar -> _id ($CARID)" || no "createCar" "$R"

echo "== get cars =="
R=$(post /api/v1/car/getCarsByUserId "{\"token\":\"$UTOKEN\",\"id\":\"x\"}")
echo "$R" | grep -q "$CARID" && ok "getCarsByUserId" || no "getCarsByUserId" "$R"

echo "== carFuel create + nested gasCategory =="
GCID=$(post /api/v1/gasCategory/getGasCategories "{\"token\":\"$UTOKEN\",\"name_uz\":\"AI-92\",\"name_ru\":\"\",\"limit\":1,\"page\":1}" | field "data.0.id")
R=$(post /api/v1/carFuel/createCarFuels "{\"token\":\"$UTOKEN\",\"carId\":\"$CARID\",\"gasCategoryId\":\"$GCID\"}")
CFID=$(echo "$R" | field "data._id")
{ [ -n "$CFID" ] && echo "$R" | grep -q '"gasCategory"'; } && ok "createCarFuel -> _id + nested gasCategory" || no "createCarFuel" "$R"

echo "== get carFuels =="
R=$(post /api/v1/carFuel/getCarFuelsByCarId "{\"token\":\"$UTOKEN\",\"carId\":\"$CARID\"}")
echo "$R" | grep -q '"gasCategory"' && ok "getCarFuelsByCarId nested gasCategory" || no "getCarFuelsByCarId" "$R"

echo "== role guard: driver cannot list station admins =="
R=$(post /api/v1/stationAdmin/getAll "{\"token\":\"$UTOKEN\",\"name\":\"\"}")
echo "$R" | grep -q '"status":"error"' && ok "driver blocked from stationAdmin (403)" || no "role guard" "$R"

echo "== invalid token rejected =="
R=$(post /api/v1/station/dashboard '{"token":"bad.token.here"}')
echo "$R" | grep -q '"status":"error"' && ok "invalid token rejected" || no "auth guard" "$R"

echo ""
echo "RESULT: $pass passed, $fail failed"
[ "$fail" = "0" ]
