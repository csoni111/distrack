let blacklist = {};

function getBlackList() {
  let dataPath = 'data/blacklist.json';
  $.get(dataPath, function(data) {
    generateBlacklist(data);
  });
}

function generateBlacklist(data) {
  let categories = data.categories;

  for (let categoryName in categories) {
    let category = categories[categoryName];
    let serviceCount = category.length;
    let legacy = categoryName.length > 11;

    for (let i = 0; i < serviceCount; i++) {
      let service = category[i];

      for (let serviceName in service) {
        let urls = service[serviceName];

        for (let homepage in urls) {
          let domains = urls[homepage];
          let domainCount = domains.length;

          for (let j = 0; j < domainCount; j++)
            blacklist[domains[j]] = {
              category: legacy ? categoryName.slice(7) : categoryName,
              name: serviceName,
              url: homepage
            };
        }
      }
    }
  }
}

getBlackList();