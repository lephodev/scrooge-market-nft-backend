pipeline {
  agent any
  stages {
    stage('Upload Build') {
          steps {
            sshPublisher(publishers: [sshPublisherDesc(configName: 'scrooge-nft', transfers: [sshTransfer(cleanRemote: false, excludes: '', execCommand: '''rm /home/ubuntu/package.json
cd /home/ubuntu/market-nft-backend && git add .
cd /home/ubuntu/market-nft-backend && git commit -m "update"
cd /home/ubuntu/market-nft-backend && git pull origin prod
cd /home/ubuntu/market-nft-backend && npm install
pm2 kill
cd /home/ubuntu/beta-marketplace/market-nft-backend && pm2 start ecosystem.config.json
cd /home/ubuntu/dev-marketplace/market-nft-backend && pm2 start ecosystem.config.json
cd /home/ubuntu/market-nft-backend && pm2 start ecosystem.config.json''', execTimeout: 120000, flatten: false, makeEmptyDirs: false, noDefaultExcludes: false, patternSeparator: '[, ]+', remoteDirectory: '/', remoteDirectorySDF: false, removePrefix: '', sourceFiles: 'package.json')], usePromotionTimestamp: false, useWorkspaceInPromotion: false, verbose: true)])
            }
        }
  }
}
