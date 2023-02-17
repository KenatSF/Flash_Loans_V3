// SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import { IERC20 } from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import { SafeMath } from '@openzeppelin/contracts/utils/math/SafeMath.sol';
import { SafeERC20 } from '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';


// WETH
interface IWETH9 {
    function withdraw(uint wad) external;
}

// Aave
interface ILendingPool {
  function flashLoan(
    address receiverAddress,
    address[] calldata assets,
    uint256[] calldata amounts,
    uint256[] calldata modes,
    address onBehalfOf,
    bytes calldata params,
    uint16 referralCode
  ) external;
}

interface ILendingPoolAddressesProvider {
  function getLendingPool() external view returns (address);
}

interface IFlashLoanReceiver {
  function executeOperation(
    address[] calldata assets,
    uint[] calldata amounts,
    uint[] calldata premiums,
    address initiator,
    bytes calldata params
  ) external returns (bool);
}

abstract contract FlashLoanReceiverBase is IFlashLoanReceiver {
  using SafeERC20 for IERC20;
  using SafeMath for uint256;

  ILendingPoolAddressesProvider public immutable ADDRESSES_PROVIDER;
  ILendingPool public immutable LENDING_POOL;

  constructor(address provider) {
    ADDRESSES_PROVIDER = ILendingPoolAddressesProvider(provider);
    LENDING_POOL = ILendingPool(ILendingPoolAddressesProvider(provider).getLendingPool());
  }

  receive() external virtual payable {}
}

// Uniswap V2
interface IUniswapV2Router01 {
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);

    function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut) external pure returns (uint amountOut);
    function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts);
}

interface IUniswapV2Router02 is IUniswapV2Router01 {
    function swapExactTokensForTokensSupportingFeeOnTransferTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external;
}

// Uniswap V3
library TransferHelper {
    function safeApprove(
        address token,
        address to,
        uint256 value
    ) internal {
        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(IERC20.approve.selector, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), 'SA');
    }
}

interface IUniswapV3SwapCallback {
    function uniswapV3SwapCallback(
        int256 amount0Delta,
        int256 amount1Delta,
        bytes calldata data
    ) external;
}

interface ISwapRouter is IUniswapV3SwapCallback {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }

    function exactInputSingle(ExactInputSingleParams calldata params) external payable returns (uint256 amountOut);

    struct ExactInputParams {
        bytes path;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
    }

    function exactInput(ExactInputParams calldata params) external payable returns (uint256 amountOut);
}

contract newFilter {
    enum DEX_PATH {
        UNIV3_UNIV2,                
        UNIV3_SUSHI,              
        UNIV2_UNIV3,             
        SUSHI_UNIV3,            
        UNIV2_SUSHI,           
        SUSHI_UNIV2
    }

    enum DEX_Selection {
        SUSHI,
        UNIV2,
        UNIV3
    }
}

// Contract
contract Flashy is FlashLoanReceiverBase,  newFilter {
    address payable owner;
    using SafeMath for uint;

    uint256[] private quantities;
    address[] private tokens_addresses;

    uint8 private arb_swap_path;
    uint24 private fee;
    
    

    IUniswapV2Router02 public constant sushi_router_v2= IUniswapV2Router02(0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F);
    IUniswapV2Router02 public constant uni_router_v2 = IUniswapV2Router02(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);
    ISwapRouter public constant uni_router_v3 = ISwapRouter(0xE592427A0AEce92De3Edee1F18E0157C05861564);
    IWETH9 public constant weth = IWETH9(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);


    constructor(address payable _owner, address _addressProvider) FlashLoanReceiverBase(_addressProvider) {
        owner = _owner;
    }

    // Events
    event Received(address sender, uint256 value);
    event Withdraw(address to, uint256 value);
    event Minner_fee(uint256 value);
    event Withdraw_token(address to, uint256 value);

    
    modifier onlyOwner() {
      require(msg.sender == owner, "Not the Owner");
      _;
    }

    modifier checking_amount(address token, uint amount) {
        require(IERC20(token).balanceOf(address(this)) >= amount, "The amount exceeds balance!");
        _;
    }

    function new_owner(address payable _new_owner) external onlyOwner returns (bool) {
        owner = _new_owner;
        return true;
    }

    receive() external override payable {}

    function withdraw(uint256 _amount) public onlyOwner returns (bool) {
        require(_amount <= address(this).balance, "Insufficient ETH amount!");
        owner.transfer(_amount);
        
        emit Withdraw(owner, _amount);
        return true;
    } 

    function withdraw_weth(uint8 _percentage) public onlyOwner returns (bool) {
        require(IERC20(address(weth)).balanceOf(address(this))  > 0, "There is no WETH balance!"); 
        require((0 < _percentage) && (_percentage <= 100), "Invalid percentage!");

        weth.withdraw(IERC20(address(weth)).balanceOf(address(this)));

        uint256 amount_to_withdraw = SafeMath.mul(SafeMath.div(address(this).balance, 100), _percentage);
        block.coinbase.transfer(amount_to_withdraw);
        emit Minner_fee(amount_to_withdraw);

        return withdraw(address(this).balance);
    }
    
    function withdraw_token(address _token) public onlyOwner returns ( bool ) {
        uint256 balance =  IERC20(_token).balanceOf(address(this)); 
        require(balance > 0, "There is no token balance!");  
        bool check = IERC20(_token).transfer(owner, balance);

        emit Withdraw_token(owner, balance);
        return check;
    }

    function withdraw_filter(address _token, uint8 _percentage, uint8 _dex, uint24 _dexfee) public onlyOwner returns (bool) {
        if (_token == address(weth)) {
            return withdraw_weth(_percentage);
        } else {
            // The lines below are not the best way to proceed, because of we've aumented the number of txs however the payment for the minner is only allowed with WETH
            require(_dex < 3, "Invalid dex option for withdraw ETH!");
            if (DEX_Selection.SUSHI == DEX_Selection(_dex)) {
                sushi(_token, address(weth), IERC20(_token).balanceOf(address(this)));
                return withdraw_weth(_percentage);
            }
            if (DEX_Selection.UNIV2 == DEX_Selection(_dex)) {
                uni_v2(_token, address(weth), IERC20(_token).balanceOf(address(this)));
                return withdraw_weth(_percentage);
            }
            if (DEX_Selection.UNIV3 == DEX_Selection(_dex)) {
                require((_dexfee == 500) || (_dexfee == 3000) || (_dexfee == 10000), "Invalid fee for swapping in UniV3");
                uni_v3(_token, address(weth), IERC20(_token).balanceOf(address(this)), _dexfee);
                return withdraw_weth(_percentage);
            }
            return false;
        }
    }

    function get_path(address _tokenIn, address _tokenOut) internal pure returns (address[] memory) {
      address[] memory path;
      path = new address[](2);
      path[0] = _tokenIn;
      path[1] = _tokenOut;
      return path;
    }

    function get_amountsOut(uint256 _amountIn, address[] memory _path, IUniswapV2Router02 _router) public view returns (uint) {
      uint256[] memory amountsOut = _router.getAmountsOut(_amountIn, _path);
      uint amountOutMin = amountsOut[amountsOut.length - 1];
      return amountOutMin;
    }

    // Functions for swapping on 3 main dexes

   function sushi(address _tokenIn, address _tokenOut, uint256 _amountIn) public checking_amount(_tokenIn, _amountIn) {
       IERC20(_tokenIn).approve(address(sushi_router_v2), _amountIn);

       address[] memory _path = get_path(_tokenIn, _tokenOut);

        uint _amountOutMin = get_amountsOut(_amountIn, _path, sushi_router_v2);

        sushi_router_v2.swapExactTokensForTokens(_amountIn, _amountOutMin, _path, address(this), block.timestamp + 300);
   }

   function uni_v2(address _tokenIn, address _tokenOut, uint256 _amountIn) public checking_amount(_tokenIn, _amountIn) {
       IERC20(_tokenIn).approve(address(uni_router_v2), _amountIn);

       address[] memory _path = get_path(_tokenIn, _tokenOut);

        uint _amountOutMin = get_amountsOut(_amountIn, _path, uni_router_v2);

        uni_router_v2.swapExactTokensForTokens(_amountIn, _amountOutMin, _path, address(this), block.timestamp + 300);
   }

   function uni_v3(address _tokenIn, address _tokenOut, uint256 _amountIn, uint24 _fee) public payable checking_amount(_tokenIn, _amountIn) {
        TransferHelper.safeApprove(_tokenIn, address(uni_router_v3), _amountIn);

        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({                
            tokenIn: _tokenIn,                
            tokenOut: _tokenOut,                
            fee: _fee,                
            recipient: address(this),                
            deadline: block.timestamp + 300,                
            amountIn: _amountIn,                
            amountOutMinimum: 0,                
            sqrtPriceLimitX96: 0           
            });
    
        uni_router_v3.exactInputSingle(params);
    }


    function arb_swap(address _asset01, address _asset02, uint256 _amount, uint8 _dex_path, uint24 _fee) public {
        require(_dex_path < 6, "Invalid dex option for an arbitrage!");
        if (DEX_PATH.UNIV3_UNIV2 == DEX_PATH(_dex_path)) {
            require((_fee == 500) || (_fee == 3000) || (_fee == 10000), "Invalid fee for swapping in UniV3");
            uni_v3(_asset01, _asset02, _amount, _fee);
            uni_v2(_asset02, _asset01, IERC20(_asset02).balanceOf(address(this)));
        } else if (DEX_PATH.UNIV3_SUSHI == DEX_PATH(_dex_path)) {
            require((_fee == 500) || (_fee == 3000) || (_fee == 10000), "Invalid fee for swapping in UniV3");
            uni_v3(_asset01, _asset02, _amount, _fee);
            sushi(_asset02, _asset01, IERC20(_asset02).balanceOf(address(this)));            
        } else if (DEX_PATH.UNIV2_UNIV3 == DEX_PATH(_dex_path)) {
            require((_fee == 500) || (_fee == 3000) || (_fee == 10000), "Invalid fee for swapping in UniV3");
            uni_v2(_asset01, _asset02, _amount);
            uni_v3(_asset02, _asset01, IERC20(_asset02).balanceOf(address(this)), _fee);
        } else if (DEX_PATH.SUSHI_UNIV3 == DEX_PATH(_dex_path)) {
            require((_fee == 500) || (_fee == 3000) || (_fee == 10000), "Invalid fee for swapping in UniV3");
            sushi(_asset01, _asset02, _amount);
            uni_v3(_asset02, _asset01, IERC20(_asset02).balanceOf(address(this)), _fee);
        } else if (DEX_PATH.UNIV2_SUSHI == DEX_PATH(_dex_path)) {
            uni_v2(_asset01, _asset02, _amount);
            sushi(_asset02, _asset01, IERC20(_asset02).balanceOf(address(this)));
        } else if (DEX_PATH.SUSHI_UNIV2 == DEX_PATH(_dex_path)) {
            sushi(_asset01, _asset02, _amount);
            uni_v2(_asset02, _asset01, IERC20(_asset02).balanceOf(address(this)));
        }
    }


    

    
    function executeOperation(
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata premiums,
        address initiator,
        bytes calldata params
    )
        external
        override
        returns (bool)
    {
        
        //CODE
        arb_swap(tokens_addresses[0], tokens_addresses[1], quantities[0], arb_swap_path, fee);
        // CODE
        
        // Approve the LendingPool contract allowance to *pull* the owed amount
        for (uint i = 0; i < assets.length; i++) {
            uint amountOwing = amounts[i].add(premiums[i]);
            IERC20(assets[i]).approve(address(LENDING_POOL), amountOwing);
        }
        
        return true;
    }

    function _flashloan(address[] memory assets, uint256[] memory amounts) internal {
        address receiverAddress = address(this);

        uint256[] memory modes = new uint256[](assets.length);

        // 0 = no debt (flash), 1 = stable, 2 = variable
        for (uint256 i = 0; i < assets.length; i++) {
            modes[i] = 0;
        }

        address onBehalfOf = address(this);
        bytes memory params = "";
        uint16 referralCode = 0;


        LENDING_POOL.flashLoan(
            receiverAddress,
            assets,
            amounts,
            modes,
            onBehalfOf,
            params,
            referralCode
        );
    }

    
    function flash_loan(address _asset01, address _asset02, uint256 _amount, uint8 _arb_swap_path, uint24 _arb_swap_fee, uint8 _withdraw_path, uint24 _withdraw_fee, uint8 _percentage) onlyOwner public {

        address[] memory assets = new address[](1);
        assets[0] = _asset01;

        uint256[] memory amounts = new uint256[](1);
        amounts[0] = _amount;

        quantities = amounts;
        tokens_addresses = [_asset01, _asset02];
        arb_swap_path = _arb_swap_path;
        fee = _arb_swap_fee;

        _flashloan(assets, amounts);

        // The line below is only commented for testing purposes
        //withdraw_filter(_asset01, _percentage, _withdraw_path, _withdraw_fee);
    }

    function close() onlyOwner public payable {
        selfdestruct(owner);
    }
}
