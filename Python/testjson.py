import requests

url = 'https://www.bienici.com/realEstateAds.json?filters={"size":600,"from":0,"showAllModels":false,"filterType":"rent","propertyType":["house","flat","loft","castle","townhouse"],"page":1,"sortBy":"relevance","sortOrder":"desc","onTheMarket":[true],"limit":"omsiH{jiL?}__AhhZlI?bk~@","newProperty":false,"blurInfoType":["disk","exact"],"zoneIdsByTypes":{"zoneIds":["-7444"]}}&extensionType=extendedIfNoResult&access_token=XFCgRiIm/5gxwcxQg0TU81XoA5F0IuwnwxhoHtf5VDI=:653a380e4d571100b2ac40e6&id=653a380e4d571100b2ac40e6'

response = requests.get(url)

if response.status_code == 200:
    with open('reponsev14.json', 'w', encoding='utf-8') as file:
        file.write(response.text)
else:
    print(f"Erreur {response.status_code}: {response.text}")
